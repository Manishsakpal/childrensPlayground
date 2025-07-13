'use client';

import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Loader, XCircle } from 'lucide-react';
import { analyzeImage, AnalyzeImageOutput } from '@/ai/flows/analyze-image-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const formSchema = z.object({
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }),
});

export default function AnalyzePage() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeImageOutput | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: 'https://res.cloudinary.com/dtjjgiitl/image/upload/q_auto:good,f_auto,fl_progressive/v1752343064/kxi77tgkh9o7vtv95iwj.jpg',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult(null);
    setImageUrl(values.imageUrl);
    try {
      const result = await analyzeImage({ imageUrl: values.imageUrl });
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the image. Please check the URL and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 flex justify-center">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>AI Image Analyzer</CardTitle>
            <CardDescription>Enter an image URL to analyze its contents.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  Analyze Image
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="mt-4 flex items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Analyzing...</p>
          </div>
        )}

        {analysisResult && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-md">
                <Image src={imageUrl} alt="Analyzed image" layout="fill" objectFit="cover" />
              </div>

              <Alert>
                <AlertTitle>Description</AlertTitle>
                <AlertDescription>{analysisResult.description}</AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className={`flex items-center p-3 rounded-md ${analysisResult.hasSky ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  {analysisResult.hasSky ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                  <span className="ml-2 text-sm font-medium">Sky</span>
                </div>
                <div className={`flex items-center p-3 rounded-md ${analysisResult.hasTrees ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  {analysisResult.hasTrees ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                  <span className="ml-2 text-sm font-medium">Trees</span>
                </div>
                <div className={`flex items-center p-3 rounded-md ${analysisResult.hasGreenLand ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  {analysisResult.hasGreenLand ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                  <span className="ml-2 text-sm font-medium">Green Land</span>
                </div>
                <div className={`flex items-center p-3 rounded-md ${analysisResult.hasWater ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  {analysisResult.hasWater ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                  <span className="ml-2 text-sm font-medium">Water</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
