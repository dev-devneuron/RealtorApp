import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Bed, Bath, Square, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Properties = () => {
  const properties = [
    {
      id: 1,
      title: "Luxury Downtown Penthouse",
      price: "$2,500,000",
      location: "Downtown District",
      beds: 4,
      baths: 3,
      sqft: "3,200",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&h=300&fit=crop",
      type: "Sale",
      featured: true
    },
    {
      id: 2,
      title: "Modern Family Home",
      price: "$850,000",
      location: "Suburban Heights",
      beds: 5,
      baths: 4,
      sqft: "4,100",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop",
      type: "Sale",
      featured: false
    },
    {
      id: 3,
      title: "Waterfront Condo",
      price: "$3,200/month",
      location: "Marina Bay",
      beds: 2,
      baths: 2,
      sqft: "1,800",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=300&fit=crop",
      type: "Rent",
      featured: true
    },
    {
      id: 4,
      title: "Historic Townhouse",
      price: "$1,200,000",
      location: "Old Town",
      beds: 3,
      baths: 2,
      sqft: "2,400",
      image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=500&h=300&fit=crop",
      type: "Sale",
      featured: false
    },
    {
      id: 5,
      title: "Executive Apartment",
      price: "$2,800/month",
      location: "Business District",
      beds: 1,
      baths: 1,
      sqft: "900",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop",
      type: "Rent",
      featured: false
    },
    {
      id: 6,
      title: "Garden Villa Estate",
      price: "$4,200,000",
      location: "Elite Hills",
      beds: 6,
      baths: 5,
      sqft: "6,800",
      image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=500&h=300&fit=crop",
      type: "Sale",
      featured: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5">
      <div className="container mx-auto px-6 py-24">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-navy mb-4">Premium Properties</h1>
          <p className="text-navy/70 text-lg">Discover luxury homes and investment opportunities curated by our AI-powered platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <Card key={property.id} className="group hover:shadow-luxury transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0">
              <div className="relative overflow-hidden rounded-t-lg">
                <img 
                  src={property.image} 
                  alt={property.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant={property.type === "Sale" ? "default" : "secondary"}>
                    {property.type}
                  </Badge>
                  {property.featured && (
                    <Badge className="bg-gold text-navy">
                      Featured
                    </Badge>
                  )}
                </div>
                <button className="absolute top-4 right-4 p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                  <Heart className="h-4 w-4 text-navy" />
                </button>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center text-navy/60 text-sm mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.location}
                </div>
                <h3 className="text-xl font-semibold text-navy mb-2">{property.title}</h3>
                <div className="text-2xl font-bold text-gold mb-4">{property.price}</div>
                <div className="flex justify-between text-navy/60 text-sm mb-4">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    {property.beds} beds
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    {property.baths} baths
                  </div>
                  <div className="flex items-center">
                    <Square className="h-4 w-4 mr-1" />
                    {property.sqft} sqft
                  </div>
                </div>
                <Button className="w-full" variant="luxury">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Properties;