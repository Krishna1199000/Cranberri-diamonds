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
import { Share2, FileText, Video, Info} from 'lucide-react';
import { toast } from 'sonner';

interface Diamond {
  id: string;
  stockId: string;
  certificateNo: string;
  shape: string;
  size: number;
  color: string;
  clarity: string;
  cut: string;
  polish: string;
  sym: string;
  floro: string;
  lab: string;
  rapPrice: number;
  rapAmount: number;
  discount: number;
  pricePerCarat: number;
  finalAmount: number;
  measurement: string;
  depth: number;
  table: number;
  ratio: number;
  location: string;
  imageUrl?: string;
  videoUrl?: string;
  certUrl?: string;
}

export default function DiamondDetails() {
  const params = useParams();
  const [diamond, setDiamond] = useState<Diamond | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showCertDialog, setShowCertDialog] = useState(false);

  useEffect(() => {
    const fetchDiamond = async () => {
      try {
        const response = await fetch(`/api/diamonds/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setDiamond(data);
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

  const handleShare = async (platform: string) => {
    const shareUrl = `${window.location.origin}/shop/diamond/${params.id}`;
    const shareText = `Check out this ${diamond?.size}ct ${diamond?.shape} diamond!`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`);
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard!');
        } catch (error) {
          console.error('Failed to copy link:', error);
          toast.error('Failed to copy link');
        }
        break;
      default:
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
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {diamond.shape} Diamond - {diamond.size}ct {diamond.color} {diamond.clarity}
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
                    <Image src="/whatsapp.svg" alt="WhatsApp" width={24} height={24} />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handleShare('email')}
                  >
                    <Image src="/email.svg" alt="Email" width={24} height={24} />
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

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Media Section */}
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

            {/* Details Section */}
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
                        <p className="font-medium">{diamond.size.toFixed(2)}</p>
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
                        <p className="font-medium">{diamond.polish}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Symmetry</label>
                        <p className="font-medium">{diamond.sym}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Fluorescence</label>
                        <p className="font-medium">{diamond.floro}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Lab</label>
                        <p className="font-medium">{diamond.lab}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="specifications" className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Measurements</label>
                        <p className="font-medium">{diamond.measurement}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Depth %</label>
                        <p className="font-medium">{diamond.depth}%</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Table %</label>
                        <p className="font-medium">{diamond.table}%</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Ratio</label>
                        <p className="font-medium">{diamond.ratio}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Certificate No.</label>
                        <p className="font-medium">{diamond.certificateNo}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Location</label>
                        <p className="font-medium">{diamond.location}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Price Section */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Price per Carat</span>
                    <span className="font-semibold">${diamond.pricePerCarat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Price</span>
                    <span className="text-2xl font-bold">${diamond.finalAmount.toLocaleString()}</span>
                  </div>
                  <Button className="w-full">Request More Information</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}