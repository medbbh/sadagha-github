// utils/iconMap.js
import { 
  ChartLine, GraduationCap, HeartPulse, Baby, Droplet,
  Leaf, HandHeart, Lightbulb, Home, Utensils, BookOpen, 
  Users, Coins, Stethoscope, Trees, School, Shirt, 
  Folder, Heart, Building2, Sprout, Briefcase, 
  Globe, Shield, Zap, Waves, Mountain, Sun,
  Moon, Star, Gift, Handshake, Building, 
  Factory, Truck, Hammer, Wrench, Package,
  ShoppingBag, Church, Cross, BookMarked, Library,
  Landmark, Hospital, Pill, Syringe, Activity, 
  HeartHandshake, Tent, TreePine, Fish, Wheat, 
  Apple, Carrot, Beef, Smile, Users2, Target,
  TrendingUp, DollarSign, CreditCard, Wallet,
  HandCoins, Banknote, PiggyBank, BarChart3
} from 'lucide-react';

export const iconMap = {
  // Core Categories
  'chart-line': ChartLine,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  'baby': Baby,
  'droplet': Droplet,
  'leaf': Leaf,
  'hand-holding-heart': HandHeart,
  'lightbulb': Lightbulb,
  'home': Home,
  'utensils': Utensils,
  'book-open': BookOpen,
  'users': Users,
  'coins': Coins,
  'stethoscope': Stethoscope,
  'trees': Trees,
  'school': School,
  'shirt': Shirt,
  'folder': Folder,
  
  // Islamic & Arab Context
  'church': Church, // Can represent places of worship
  'cross': Cross,
  'book-marked': BookMarked, // Religious texts
  'library': Library, // Islamic learning
  'moon': Moon, // Ramadan, Islamic calendar
  'star': Star, // Islamic symbolism
  'landmark': Landmark, // Mosques, heritage sites
  
  // Crowdfunding Specific
  'target': Target, // Campaign goals
  'trending-up': TrendingUp, // Success metrics
  'dollar-sign': DollarSign, // Fundraising
  'credit-card': CreditCard, // Donations
  'wallet': Wallet, // Financial support
  'hand-coins': HandCoins, // Giving/Charity (Zakat)
  'banknote': Banknote, // Money
  'piggy-bank': PiggyBank, // Savings
  'bar-chart': BarChart3, // Campaign analytics
  
  // Community & Support
  'heart': Heart,
  'gift': Gift, // Sadaqah/charity
  'handshake': Handshake,
  'users2': Users2,
  'smile': Smile,
  'heart-handshake': HeartHandshake,
  
  // Infrastructure
  'building2': Building2,
  'building': Building,
  'hospital': Hospital,
  'factory': Factory,
  
  // Agriculture & Food
  'sprout': Sprout,
  'wheat': Wheat,
  'fish': Fish,
  'apple': Apple,
  'carrot': Carrot,
  'beef': Beef,
  
  // Relief & Support
  'tent': Tent,
  'package': Package,
  'truck': Truck,
  'shopping-bag': ShoppingBag,
  'shield': Shield,
  
  // Energy & Environment
  'zap': Zap,
  'sun': Sun,
  'waves': Waves,
  'mountain': Mountain,
  'tree-pine': TreePine,
  
  // Services
  'briefcase': Briefcase,
  'hammer': Hammer,
  'wrench': Wrench,
  'globe': Globe,
  'pill': Pill,
  'syringe': Syringe,
  'activity': Activity,
};

export const iconLabels = {
  'chart-line': 'Economic Development',
  'graduation-cap': 'Education',
  'heart-pulse': 'Healthcare',
  'baby': 'Orphan Care',
  'droplet': 'Water & Sanitation',
  'leaf': 'Environment',
  'hand-holding-heart': 'Emergency Relief',
  'lightbulb': 'Technology',
  'home': 'Housing',
  'utensils': 'Food Security',
  'book-open': 'Literacy',
  'users': 'Community',
  'coins': 'Financial Aid',
  'stethoscope': 'Medical',
  'trees': 'Reforestation',
  'school': 'School Building',
  'shirt': 'Clothing',
  
  // Islamic & Arab
  'church': 'Places of Worship',
  'cross': 'Faith Based',
  'book-marked': 'Quran & Religious Education',
  'library': 'Islamic Studies',
  'moon': 'Ramadan Programs',
  'star': 'Islamic Heritage',
  'landmark': 'Mosque Building',
  
  // Crowdfunding
  'target': 'Campaign Goals',
  'trending-up': 'Growing Campaigns',
  'dollar-sign': 'Fundraising',
  'credit-card': 'Online Donations',
  'wallet': 'Financial Support',
  'hand-coins': 'Zakat & Charity',
  'banknote': 'Money Collection',
  'piggy-bank': 'Savings Programs',
  'bar-chart': 'Campaign Analytics',
  
  // Community
  'heart': 'Love & Care',
  'gift': 'Sadaqah',
  'handshake': 'Partnership',
  'users2': 'Community Support',
  'smile': 'Happiness Programs',
  'heart-handshake': 'Care & Support',
  
  // Infrastructure
  'building2': 'Infrastructure',
  'building': 'Construction',
  'hospital': 'Hospital Care',
  'factory': 'Manufacturing',
  
  // Agriculture
  'sprout': 'Growth',
  'wheat': 'Farming',
  'fish': 'Fishing',
  'apple': 'Nutrition',
  'carrot': 'Organic Farming',
  'beef': 'Livestock',
  
  // Relief
  'tent': 'Shelter',
  'package': 'Relief Packages',
  'truck': 'Logistics',
  'shopping-bag': 'Shopping Assistance',
  'shield': 'Protection',
  
  // Energy
  'zap': 'Energy',
  'sun': 'Solar Energy',
  'waves': 'Marine Conservation',
  'mountain': 'Adventure',
  'tree-pine': 'Forest Conservation',
  
  // Services
  'briefcase': 'Employment',
  'hammer': 'Repairs',
  'wrench': 'Maintenance',
  'globe': 'Global Initiative',
  'pill': 'Medicine',
  'syringe': 'Vaccination',
  'activity': 'Fitness & Sports',
};

export const iconOptions = Object.keys(iconMap).map(key => ({
  value: key,
  label: iconLabels[key],
  Icon: iconMap[key]
}));