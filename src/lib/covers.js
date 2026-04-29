// Default category cover images for events without uploaded photos
export const CATEGORY_COVERS = {
  'food-drink': '/covers/food-drink.svg',
  'music': '/covers/music.svg',
  'markets': '/covers/markets.svg',
  'sport-fitness': '/covers/sport-fitness.svg',
  'community': '/covers/community.svg',
  'business': '/covers/business.svg',
  'family': '/covers/family.svg',
  'arts-culture': '/covers/arts-culture.svg',
  'nightlife': '/covers/nightlife.svg',
  'faith-christian': '/covers/faith-christian.svg',
  'kids': '/covers/family.svg',
  'education': '/covers/arts-culture.svg',
  'workshops': '/covers/business.svg',
  'networking': '/covers/business.svg',
  'charity': '/covers/community.svg',
  'outdoors': '/covers/sport-fitness.svg',
  'wellness': '/covers/sport-fitness.svg',
  'tech': '/covers/business.svg',
  'entertainment': '/covers/nightlife.svg',
  'seasonal': '/covers/markets.svg',
  'online': '/covers/business.svg',
  'default': '/covers/default.svg',
};

export const getCategoryCover = (categoryId) => {
  return CATEGORY_COVERS[categoryId] || CATEGORY_COVERS.default;
};

export const getEventCover = (event) => {
  if (event.img) return event.img;
  if (event.images?.length) return event.images[0].url || event.images[0];
  return getCategoryCover(event.category);
};
