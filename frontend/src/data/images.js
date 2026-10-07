// Match photographs by name, never by demo IDs: live Oracle IDs may differ.
export const images = {
  lalbagh: {
    src: "/images/lalbagh.jpg",
    match: /lalbagh botanical/i,
    credit: "Subhashish Panigrahi",
    license: "CC BY-SA 3.0",
    url: "https://commons.wikimedia.org/wiki/File:Lalbagh_glass_house,_Bangalore.jpg",
  },
  palace: {
    src: "/images/palace.jpg",
    match: /^(bangalore|bengaluru) palace$/i,
    credit: "Shubham Shah",
    license: "CC BY-SA 4.0",
    url: "https://commons.wikimedia.org/wiki/File:Bengaluru_Palace.jpg",
  },
  gateway: {
    src: "/images/gateway.jpg",
    match: /^gateway of india$/i,
    credit: "Joe Ravi",
    license: "CC BY-SA 3.0",
    url: "https://commons.wikimedia.org/wiki/File:Gateway_Of_India.jpg",
  },
  marine: {
    src: "/images/marine.jpg",
    match: /^marine drive$/i,
    credit: "A.Savin, Wikipedia",
    license: "Free Art License",
    url: "https://commons.wikimedia.org/wiki/File:Mumbai_03-2016_45_sunset_at_Marine_Drive.jpg",
  },
};
export function imageFor(poi) {
  return (
    images[poi.imageKey] ||
    Object.values(images).find((image) => image.match.test(poi.name))
  );
}
