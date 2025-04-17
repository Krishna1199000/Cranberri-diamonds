"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

type FormValues = z.infer<typeof formSchema>;

interface PasswordVerificationProps {
  onSuccess: () => void;
}

export default function PasswordVerification({ onSuccess }: PasswordVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  const verifyPassword = async (data: FormValues) => {
    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: data.password }),
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Verification successful');
        onSuccess();
      } else {
        setAttempts(prev => prev + 1);
        
        if (attempts + 1 >= maxAttempts) {
          toast.error('Too many failed attempts. Please try again later.');
        } else {
          toast.error('Incorrect password. Please try again.');
          form.setValue('password', '');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg animate-in fade-in-50 duration-300">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-primary/10 p-3 rounded-full">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Verification</CardTitle>
          <CardDescription className="text-center">
            Please enter your password to access user management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(verifyPassword)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
                        {...field} 
                        autoComplete="current-password"
                        disabled={isVerifying || attempts >= maxAttempts}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {attempts > 0 && (
                <div className={cn(
                  "text-sm p-3 rounded-md flex items-center gap-2",
                  attempts >= maxAttempts 
                    ? "bg-destructive/10 text-destructive" 
                    : "bg-amber-50 text-amber-700"
                )}>
                  <ShieldAlert size={16} />
                  <p>
                    {attempts >= maxAttempts 
                      ? "Too many attempts. Please try again later." 
                      : `Failed attempts: ${attempts}/${maxAttempts}`}
                  </p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isVerifying || attempts >= maxAttempts}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-xs text-muted-foreground text-center">
            This additional security step helps protect sensitive user data.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}