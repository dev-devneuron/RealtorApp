import { useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, MapPin, Bed, Bath, Ruler } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const propertyId = Number(id ?? 1);

  useEffect(() => {
    const title = `Property #${propertyId} | EliteRealty AI`;
    const description = `Details for Premium Residence #${propertyId} including photos and specifications.`;
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [propertyId]);

  const property = useMemo(() => ({
    id: propertyId,
    title: `Premium Residence #${propertyId}`,
    price: 350000 + ((propertyId - 1) * 1250),
    location: (propertyId - 1) % 3 === 0 ? "Downtown" : (propertyId - 1) % 3 === 1 ? "Uptown" : "Waterfront",
    beds: ((propertyId - 1) % 5) + 1,
    baths: ((propertyId - 1) % 3) + 1,
    sqft: 800 + ((propertyId - 1) * 15),
    type: (propertyId - 1) % 2 === 0 ? "For Sale" : "For Rent",
    featured: (propertyId - 1) % 7 === 0,
  }), [propertyId]);

  const imageIndex = (n: number) => ((propertyId + n) % 6) + 1;
  const images = [
    `/images/properties/property-${imageIndex(0)}.jpg`,
    `/images/properties/property-${imageIndex(1)}.jpg`,
    `/images/properties/property-${imageIndex(2)}.jpg`,
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-navy/10 to-background">
      <header className="container mx-auto px-6 pt-28 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-accent-gradient p-2 rounded-lg shadow-glow">
              <Home className="h-6 w-6 text-navy" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-navy">{property.title}</h1>
              <p className="text-muted-foreground">Discover the details, photos, and features</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="secondary">
              <Link to="/">Back to Home</Link>
            </Button>
            <Button asChild variant="gold">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 pb-16 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-navy">Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <Carousel className="w-full">
                <CarouselContent>
                  {images.map((src, idx) => (
                    <CarouselItem key={idx}>
                      <div className="relative overflow-hidden rounded-md">
                        <img
                          src={src}
                          alt={`${property.title} photo ${idx + 1}`}
                          loading="lazy"
                          className="w-full h-[360px] sm:h-[480px] object-cover transition-transform duration-500"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-navy">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="text-xl font-semibold text-navy">${property.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {property.location}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-1"><Bed className="h-4 w-4" /> {property.beds} Beds</div>
                <div className="flex items-center gap-1"><Bath className="h-4 w-4" /> {property.baths} Baths</div>
                <div className="flex items-center gap-1"><Ruler className="h-4 w-4" /> {property.sqft.toLocaleString()} sqft</div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{property.type}</Badge>
                {property.featured && <Badge className="bg-gold text-navy">Featured</Badge>}
              </div>
              <div className="pt-4">
                <Button variant="luxury" className="w-full">Schedule a Viewing</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-navy">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is a placeholder description for {property.title}. Replace this text with real content once your backend is connected.
                Enjoy spacious living areas, modern amenities, and an excellent location.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button asChild variant="secondary" className="flex-1">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Home
              </Link>
            </Button>
            <Button asChild variant="gold" className="flex-1">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PropertyDetails;
