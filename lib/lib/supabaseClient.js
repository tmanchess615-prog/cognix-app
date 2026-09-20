export const SITE = 'https://cognix.co.za';

export const CLIENTS_REGISTRY = {
  // 🧪 TEST ROUTE: https://cognix.co.za
  "test": {
    businessName: "Cognix Test Lounge",
    googleUrl: "https://google.com"
  },
  
  // 📥 ACTIVE HARDWARE CLIENT 1
  "stand1": {
    businessName: "The Cape Town Coffee Club",
    googleUrl: "https://google.com"
  }
};

export const supabase = {
  auth: {
    getUser: () => ({ data: { user: null } }),
    signInWithPassword: () => ({ error: { message: "Portal paused" } }),
    signUp: () => ({ error: { message: "Portal paused" } }),
    signOut: () => {}
  }
};
