# YBS AI - Yangon Bus Service Intelligent Hub

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4.0-yellow.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-blue.svg)](https://tailwindcss.com/)

A modern, intelligent web application for Yangon Bus Service (YBS) that provides comprehensive bus route information, AI-powered assistance, and user feedback system. Built with React, TypeScript, and cutting-edge web technologies.

![YBS AI Preview](./preview.png)

## 🌟 Features

### 🏠 **Explore Dashboard**
- **Daily Transit Advisory**: AI-powered daily updates and announcements
- **Recent History (Remini)**: Quick access to previously searched routes
- **Nearest Bus Stops Finder**: GPS-based location service to find nearby bus stops
- **Interactive Map Integration**: Visual route planning and stop locations

### 🛣️ **Route Finder**
- **Smart Path Calculation**: Find direct bus routes between any two points
- **AI Route Suggestions**: Intelligent recommendations using Gemini AI
- **Interactive Route Details**: Full route maps with stop-by-stop information
- **Real-time Route Switching**: Navigate between different bus lines seamlessly

### 🚌 **Bus Lines Inventory**
- **Complete Route Database**: All YBS bus routes with detailed information
- **Advanced Search**: Filter routes by number, stops, or operator
- **Route Visualization**: Interactive maps for each bus line
- **Pagination**: Efficient browsing through extensive route collection

### 🤖 **AI Assistant**
- **Conversational AI**: Powered by Gemini AI for natural language queries
- **Multi-language Support**: English and Burmese language processing
- **Contextual Responses**: Understands bus routes, weather, and YBS card information
- **Persistent Chat History**: Maintains conversation context

### 💬 **Feedback System**
- **User Feedback Collection**: Anonymous or named feedback submission
- **Developer Information**: Contact details and app information
- **Success Notifications**: Visual confirmation of feedback submission
- **Database Integration**: Supabase-powered feedback storage

## 🎨 UI/UX Design

### **Design Philosophy**
- **Glass-morphism**: Modern frosted glass effects with backdrop blur
- **Dark Theme**: Sleek slate-based color scheme optimized for readability
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Accessibility**: High contrast ratios and keyboard navigation support

### **Key UI Components**

#### **Navigation**
- **Sidebar Navigation**: Collapsible menu with animated icons
- **Mobile Bottom Tabs**: Touch-optimized navigation for mobile devices
- **Active State Indicators**: Yellow accent highlighting for current section

#### **Cards & Panels**
- **Glass Cards**: Semi-transparent panels with subtle borders
- **Interactive Elements**: Hover effects and smooth transitions
- **Loading States**: Skeleton screens and shimmer animations
- **Modal Overlays**: Full-screen route detail modals

#### **Forms & Inputs**
- **Styled Input Fields**: Custom focus states with yellow accents
- **Validation Feedback**: Real-time form validation
- **Success Messages**: Animated confirmation notifications

#### **Maps & Visualization**
- **Interactive Bus Maps**: Custom map component with route overlays
- **Stop Timelines**: Vertical timeline layout for route stops
- **Color-coded Routes**: Unique colors for each bus line

### **Typography & Icons**
- **Custom Font Stack**: System fonts with Myanmar language support
- **HeroIcons**: Consistent iconography throughout the application
- **Text Hierarchy**: Clear information architecture with proper contrast

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager
- Supabase account (for feedback system)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ybs-ai.git
   cd ybs-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```

   Configure your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
ybs-ai/
├── public/
│   ├── data/
│   │   ├── busData.ts          # Bus routes and configuration
│   │   ├── routes/             # Individual route JSON files
│   │   └── stops.tsv           # Bus stop coordinates and names
│   └── assets/                 # Static assets
├── src/
│   ├── components/
│   │   └── BusMap.tsx          # Interactive map component
│   ├── services/
│   │   ├── geminiService.ts    # AI integration
│   │   └── supabaseService.ts  # Database operations
│   ├── types.ts                # TypeScript type definitions
│   ├── App.tsx                 # Main application component
│   └── index.tsx               # Application entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🛠️ Technical Stack

### **Frontend Framework**
- **React 18**: Modern React with concurrent features
- **TypeScript**: Type-safe development experience
- **Vite**: Fast build tool and development server

### **Styling & UI**
- **Tailwind CSS**: Utility-first CSS framework
- **Custom CSS**: Glass-morphism effects and animations
- **Responsive Design**: Mobile-first approach

### **Data & APIs**
- **Supabase**: Real-time database for feedback system
- **Gemini AI**: Google's AI for intelligent route suggestions
- **Custom Data Layer**: Local JSON/TSV data for bus information

### **Development Tools**
- **ESLint**: Code linting and formatting
- **TypeScript Compiler**: Type checking
- **Vite Dev Server**: Hot module replacement

## 🔧 Configuration

### **Supabase Setup**
1. Create a new Supabase project
2. Create a `feedback` table with the following schema:
   ```sql
   CREATE TABLE feedback (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     username TEXT,
     title TEXT NOT NULL,
     description TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. Enable Row Level Security (RLS) and create policies for public access

### **Environment Variables**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📱 Usage Guide

### **Finding Routes**
1. Navigate to the "Finder" tab
2. Enter origin and destination points
3. Click "Calculate Path" to see available routes
4. View AI suggestions and detailed route information

### **Exploring Bus Lines**
1. Go to the "Lines" tab
2. Browse or search for specific bus routes
3. Click on any route to view detailed information
4. Use the map to visualize the route

### **AI Assistant**
1. Access the "Assistant" tab
2. Ask questions about routes, weather, or YBS services
3. The AI understands both English and Burmese

### **Submitting Feedback**
1. Visit the "Feedback" tab
2. Fill out the feedback form (name optional)
3. Submit to send feedback to developers
4. Success confirmation will appear

## 🌐 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Yangon Bus Service** for providing route data
- **Google Gemini AI** for intelligent assistance
- **Supabase** for database infrastructure
- **Tailwind CSS** for styling framework

## 📞 Support

For support, feedback, or questions:
- **Email**: arkaryan.info@gmail.com
- **Website**: https://ybs-mm.vercel.app
- **Feedback**: Use the in-app feedback system

---

**Built with ❤️ for Yangon commuters**
