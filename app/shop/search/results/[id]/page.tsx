"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, FileText, Video, Info, Mail, MessageCircle} from 'lucide-react';
import { toast } from 'sonner';

interface Diamond {
  id: string;
  stockId: string;
  certificateNo: string; // Mapped from stockId
  shape: string;
  size: number; // This is carat
  color: string;
  clarity: string;
  cut: string | null;
  polish: string | null;
  sym: string | null;
  floro: string; // Not available in inventory
  lab: string | null;
  rapPrice: number; // Not available in inventory
  rapAmount: number; // Not available in inventory
  discount: number; // Not available in inventory
  pricePerCarat: number | null;
  finalAmount: number;
  measurement: string | null;
  depth: number | null;
  table: number | null;
  ratio: number | null;
  location: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  certUrl?: string | null;
  status: 'AVAILABLE' | 'HOLD' | 'MEMO' | 'SOLD';
  greenPricePerCarat?: number | null;
  greenPrice?: number | null;
  redPricePerCarat?: number | null;
  redPrice?: number | null;
  growthType?: string | null;
  flourence?: string | null;
}

export default function DiamondDetails() {
  const params = useParams();
  const [diamond, setDiamond] = useState<Diamond | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'employee' | 'customer'>('customer');
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          setUserRole(user.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchDiamond = async () => {
      try {
        const response = await fetch(`/api/inventory-items/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          // Map inventory item to diamond interface
          const mappedDiamond: Diamond = {
            ...data,
            certificateNo: data.stockId || data.certificateNo || '',
            floro: data.flourence || '',
            rapPrice: 0,
            rapAmount: 0,
            discount: 0,
            depth: data.depth ?? null,
            table: data.table ?? null,
            ratio: data.ratio ?? null,
            polish: data.polish ?? null,
            sym: data.sym ?? null,
            lab: data.lab ?? null,
            pricePerCarat: data.pricePerCarat ?? null,
            finalAmount: data.finalAmount ?? 0,
            greenPricePerCarat: data.greenPricePerCarat ?? null,
            greenPrice: data.greenPrice ?? null,
            redPricePerCarat: data.redPricePerCarat ?? null,
            redPrice: data.redPrice ?? null,
            growthType: data.growthType ?? null,
            flourence: data.flourence ?? null,
          };
          setDiamond(mappedDiamond);
        } else {
          toast.error('Failed to fetch diamond details');
        }
      } catch (error) {
        console.error('Error fetching diamond:', error);
        toast.error('Failed to fetch diamond details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDiamond();
    }
  }, [params.id]);

  const handleRequestInfo = async () => {
    if (!diamond) return;
    
    setIsRequestingInfo(true);
    try {
      const response = await fetch(`/api/inventory-items/${params.id}/request-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Request submitted successfully! Our team will contact you soon.');
      } else {
        toast.error(data.error || 'Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting information:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsRequestingInfo(false);
    }
  };

  const handleShare = async (platform: string) => {
    if (!diamond) return;

    const productUrl = `${window.location.origin}/shop/search/results/${params.id}`;
    const shareText = `Check out this ${diamond.size !== null && diamond.size !== undefined ? `${diamond.size}ct` : ''} ${diamond.shape} diamond!`;

    // Function to convert image to base64
    const getImageBase64 = async (imageUrl: string): Promise<string> => {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error converting image to base64:', error);
        return '';
      }
    };

    switch (platform) {
      case 'whatsapp':
        if (diamond.imageUrl) {
          // WhatsApp can't directly share images via URL, so we'll include the image URL and product URL
          const whatsappText = `${shareText}\n\n${productUrl}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`);
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + productUrl)}`);
        }
        break;

      case 'email':
        let emailBody = shareText + '\n\n';
        if (diamond.imageUrl) {
          const imageBase64 = await getImageBase64(diamond.imageUrl);
          emailBody += `<img src="${imageBase64}" alt="Diamond Image" style="max-width: 100%; height: auto;"><br><br>`;
        }
        emailBody += `View more details: ${productUrl}`;

        const mailtoLink = `mailto:?subject=${encodeURIComponent(`${diamond.size !== null && diamond.size !== undefined ? `${diamond.size}ct` : ''} ${diamond.shape} Diamond`)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoLink);
        break;

      case 'copy':
        const textToCopy = `${shareText}\n\n${productUrl}`;
        try {
          await navigator.clipboard.writeText(textToCopy);
          toast.success('Link copied to clipboard!');
        } catch (error) {
          console.error('Failed to copy link:', error);
          toast.error('Failed to copy link');
        }
        break;
    }
    setShowShareDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!diamond) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Diamond not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {diamond.shape} Diamond - {diamond.size !== null && diamond.size !== undefined ? `${diamond.size}ct` : ''} {diamond.color} {diamond.clarity}
            </h1>
            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Diamond</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 p-4">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handleShare('whatsapp')}
                  >
                    <MessageCircle className="h-6 w-6" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handleShare('email')}
                  >
                    <Mail className="h-6 w-6" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    className="col-span-2"
                    onClick={() => handleShare('copy')}
                  >
                    Copy Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                    {diamond.imageUrl ? (
                      <Image
                        src={diamond.imageUrl}
                        alt={`${diamond.shape} Diamond`}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Info className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                {diamond.videoUrl && (
                  <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Video className="h-4 w-4 mr-2" />
                        View Video
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] h-[600px]">
                      <DialogHeader>
                        <DialogTitle>Diamond Video</DialogTitle>
                      </DialogHeader>
                      <div className="relative w-full h-full">
                        <iframe
                          src={diamond.videoUrl}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {diamond.certUrl && (
                  <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        View Certificate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] h-[600px]">
                      <DialogHeader>
                        <DialogTitle>Diamond Certificate</DialogTitle>
                      </DialogHeader>
                      <div className="relative w-full h-full">
                        <iframe
                          src={diamond.certUrl}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="specifications">Specifications</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Stock ID</label>
                        <p className="font-medium">{diamond.stockId}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Shape</label>
                        <p className="font-medium">{diamond.shape}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Carat</label>
                        <p className="font-medium">{diamond.size !== null && diamond.size !== undefined ? diamond.size.toFixed(2) : '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Color</label>
                        <p className="font-medium">{diamond.color}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Clarity</label>
                        <p className="font-medium">{diamond.clarity}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Cut</label>
                        <p className="font-medium">{diamond.cut}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Polish</label>
                        <p className="font-medium">{diamond.polish || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Symmetry</label>
                        <p className="font-medium">{diamond.sym || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Fluorescence</label>
                        <p className="font-medium">{diamond.flourence || diamond.floro || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Lab</label>
                        <p className="font-medium">{diamond.lab || '-'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="specifications" className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Measurements</label>
                        <p className="font-medium">{diamond.measurement || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Depth %</label>
                        <p className="font-medium">{diamond.depth !== null && diamond.depth !== undefined ? `${diamond.depth}%` : '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Table %</label>
                        <p className="font-medium">{diamond.table !== null && diamond.table !== undefined ? `${diamond.table}%` : '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Growth Type</label>
                        <p className="font-medium">{diamond.growthType || '-'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Ratio</label>
                        <p className="font-medium">{diamond.ratio !== null && diamond.ratio !== undefined ? diamond.ratio.toFixed(2) : '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Certificate No.</label>
                        <p className="font-medium">{diamond.certificateNo || diamond.stockId || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Location</label>
                        <p className="font-medium">{diamond.location || '-'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {userRole === 'admin' || userRole === 'employee' ? (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price per Carat</span>
                      <span className="font-semibold">
                        {diamond.pricePerCarat !== null && diamond.pricePerCarat !== undefined 
                          ? `$${diamond.pricePerCarat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Price</span>
                      <span className="text-2xl font-bold">
                        ${diamond.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {diamond.greenPricePerCarat !== null && diamond.greenPricePerCarat !== undefined && (
                      <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                        <span className="text-gray-600">Green Price per Carat</span>
                        <span className="font-semibold text-green-700">
                          ${diamond.greenPricePerCarat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {diamond.greenPrice !== null && diamond.greenPrice !== undefined && (
                      <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                        <span className="text-gray-600">Green Price (Total)</span>
                        <span className="font-semibold text-green-700">
                          ${diamond.greenPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {diamond.redPricePerCarat !== null && diamond.redPricePerCarat !== undefined && (
                      <div className="flex justify-between items-center bg-red-50 p-2 rounded">
                        <span className="text-gray-600">Red Price per Carat</span>
                        <span className="font-semibold text-red-700">
                          ${diamond.redPricePerCarat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {diamond.redPrice !== null && diamond.redPrice !== undefined && (
                      <div className="flex justify-between items-center bg-red-50 p-2 rounded">
                        <span className="text-gray-600">Red Price (Total)</span>
                        <span className="font-semibold text-red-700">
                          ${diamond.redPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <Button 
                      className="w-full" 
                      onClick={handleRequestInfo}
                      disabled={isRequestingInfo}
                    >
                      {isRequestingInfo ? 'Submitting...' : 'Request More Information'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-8">
                  <Button 
                    className="w-full"
                    onClick={handleRequestInfo}
                    disabled={isRequestingInfo}
                  >
                    {isRequestingInfo ? 'Submitting...' : 'Request Price Information'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}