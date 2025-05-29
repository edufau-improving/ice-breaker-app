'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { currentMockUser, samplePrompts } from '@/lib/mock-data';
import { IceCream2, UploadCloud } from 'lucide-react';
import type { Metadata } from 'next';

// Cannot use export const metadata on client component. 
// This page should have a title like "Create Icebreaker" set in a parent server component or layout if dynamic title is needed.

const formSchema = z.object({
  promptOption: z.enum(['existing', 'new']),
  existingPrompt: z.string().optional(),
  newPromptTitle: z.string().optional(),
  newPromptDescription: z.string().optional(),
  entryText: z.string().min(1, 'Your entry text cannot be empty.'),
  imageFile: z.instanceof(File).optional(),
  topicType: z.enum(['text', 'photo', 'mixed']).default('mixed'),
}).superRefine((data, ctx) => {
  if (data.promptOption === 'existing' && !data.existingPrompt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select an existing prompt.',
      path: ['existingPrompt'],
    });
  }
  if (data.promptOption === 'new') {
    if (!data.newPromptTitle || data.newPromptTitle.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New prompt title must be at least 3 characters.',
        path: ['newPromptTitle'],
      });
    }
    if (!data.newPromptDescription || data.newPromptDescription.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New prompt description must be at least 10 characters.',
        path: ['newPromptDescription'],
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateIcebreakerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [promptOption, setPromptOption] = useState<'existing' | 'new'>('existing');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promptOption: 'existing',
      entryText: '',
      topicType: 'mixed'
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('imageFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue('imageFile', undefined);
      setImagePreview(null);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    console.log('Form data:', data);

    // Placeholder for actual submission logic (e.g., to Firebase)
    // This would involve:
    // 1. Uploading image to Firebase Storage if present.
    // 2. Creating new icebreaker document in Firestore.
    // 3. Creating new entry document in Firestore.

    setTimeout(() => {
      toast({
        title: 'Icebreaker Created!',
        description: 'Your new icebreaker has been posted.',
      });
      setIsLoading(false);
      router.push('/'); // Redirect to feed
    }, 1500);
  };
  
  const selectedPromptOption = form.watch('promptOption');

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <IceCream2 className="h-7 w-7 text-primary" />
            Create New Icebreaker
          </CardTitle>
          <CardDescription>Share something fun to help your team bond!</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Prompt Selection */}
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Select
                defaultValue="existing"
                onValueChange={(value: 'existing' | 'new') => {
                  setPromptOption(value);
                  form.setValue('promptOption', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose or create a prompt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Use an existing prompt</SelectItem>
                  <SelectItem value="new">Create a new prompt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPromptOption === 'existing' && (
              <div className="space-y-2">
                <Label htmlFor="existingPrompt">Select Prompt</Label>
                <Select {...form.register('existingPrompt')} onValueChange={(value) => form.setValue('existingPrompt', value)}>
                  <SelectTrigger id="existingPrompt">
                    <SelectValue placeholder="Choose from available prompts..." />
                  </SelectTrigger>
                  <SelectContent>
                    {samplePrompts.map(p => (
                      <SelectItem key={p.title} value={p.title}>{p.title} - <em className="text-xs text-muted-foreground">{p.description.substring(0,30)}...</em></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.existingPrompt && <p className="text-sm text-destructive">{form.formState.errors.existingPrompt.message}</p>}
              </div>
            )}

            {selectedPromptOption === 'new' && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="newPromptTitle">New Prompt Title</Label>
                  <Input id="newPromptTitle" {...form.register('newPromptTitle')} placeholder="e.g., Your Favorite Workspace Gadget" />
                  {form.formState.errors.newPromptTitle && <p className="text-sm text-destructive">{form.formState.errors.newPromptTitle.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPromptDescription">New Prompt Description</Label>
                  <Textarea id="newPromptDescription" {...form.register('newPromptDescription')} placeholder="e.g., Share a photo or description of a gadget that makes your workday better." />
                  {form.formState.errors.newPromptDescription && <p className="text-sm text-destructive">{form.formState.errors.newPromptDescription.message}</p>}
                </div>
              </div>
            )}
            
            {/* Topic Type */}
             <div className="space-y-2">
                <Label htmlFor="topicType">Topic Type (for your entry)</Label>
                <Select {...form.register('topicType')} onValueChange={(value: 'text' | 'photo' | 'mixed') => form.setValue('topicType', value)} defaultValue="mixed">
                  <SelectTrigger id="topicType">
                    <SelectValue placeholder="Select entry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Only</SelectItem>
                    <SelectItem value="photo">Photo (with optional text)</SelectItem>
                    <SelectItem value="mixed">Mixed (Text and Photo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>


            {/* Your Entry */}
            <div className="space-y-2">
              <Label htmlFor="entryText">Your Entry</Label>
              <Textarea
                id="entryText"
                {...form.register('entryText')}
                placeholder="Share your story, thoughts, or context..."
                rows={5}
              />
              {form.formState.errors.entryText && <p className="text-sm text-destructive">{form.formState.errors.entryText.message}</p>}
            </div>

            {/* Image Upload */}
            {(form.getValues('topicType') === 'photo' || form.getValues('topicType') === 'mixed') && (
            <div className="space-y-2">
              <Label htmlFor="imageFile">Upload Image (Optional)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => document.getElementById('imageFile')?.click()}>
                  <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                </Button>
                {imagePreview && <Avatar><AvatarImage src={imagePreview} alt="Preview" className="h-10 w-10 rounded-md object-cover" /></Avatar>}
              </div>
              {form.formState.errors.imageFile && <p className="text-sm text-destructive">{form.formState.errors.imageFile.message}</p>}
              <p className="text-xs text-muted-foreground">Max file size: 5MB. Accepted formats: JPG, PNG, GIF.</p>
            </div>
            )}

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Posting...' : 'Post Icebreaker'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
