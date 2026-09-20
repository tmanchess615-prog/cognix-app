// Master Customer Route Registry - Add your paying clients here
export const SITE = 'https://cognix.co.za';

export const CLIENTS_REGISTRY = {
  // 🧪 TEST ROUTE: https://cognix.co.za
  "test": {
    businessName: "Cognix Test Lounge",
    googleUrl: "https://google.com"
  },
  
  // 📥 ADD YOUR FIRST REAL PAYING CLIENT BELOW THIS LINE 👇
  "cafe1": {
    businessName: "The Cape Town Coffee Club",
    googleUrl: "https://google.com"
  }
};

// Leave this empty dummy object here so your login page doesn't crash the server build pipeline
export const supabase = {
  auth: {
    getUser: () => ({ data: { user: null } }),
    signInWithPassword: () => ({ error: { message: "Portal paused" } }),
    signUp: () => ({ error: { message: "Portal paused" } }),
    signOut: () => {}
  }
};
