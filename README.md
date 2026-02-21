
# English Worksheet Generator

AI-powered platform for creating personalized English worksheets for adult learners. Designed specifically for teachers working in one-on-one educational settings.

## Latest: DSLM Layer B v5
- Dual nano_skill tagging (primary + writing) for open-ended exercises
- CEFR levels (A1-C2) in nano_skill names: `ns.A2.past_simple.irregular_verb_go`
- `visual_comprehension` category for picture-based exercises
- Updated SQL extraction functions with full backward compatibility

## 🎯 What This Is

A professional tool that generates high-quality, customized English worksheets in under 60 seconds. Each worksheet includes both student and teacher versions, with content tailored to specific learning objectives and student profiles.

## ✨ Key Features

- **AI-Powered Generation**: Creates unique worksheets based on lesson goals and student needs
- **20+ Exercise Types**: Multiple choice, fill-in-blanks, reading, dialogue, matching, listening, speaking, and more
- **Welcome Test**: Comprehensive student profiling with 49 questions, speaking recording (auto-save + Whisper transcription), listening comprehension (TTS-1 audio), AI-powered analysis with per-question scoring (0-100), auto-transcription display, Speaking score in learning profile, 10-language translations
- **DSLM (Dynamic Student Learning Model)**: Layer A event log with canonical event naming, weighted flashcard mastery (SM-2), nano_skill_ratings for worksheets/homework, and welcome test profiling — ready for Layer B metrics computation
- **Dual Versions**: Clean student worksheets + comprehensive teacher versions with answers
- **Homework System**: Interactive homework with AI evaluation and progress tracking
- **Flashcards**: Spaced repetition learning with shared sets
- **Student Progress Tracking**: Goals, learning elements, skill ratings
- **Instant Creation**: Professional materials ready in 30-60 seconds
- **Offline Capable**: Download as HTML files that work without internet
- **Mobile Responsive**: Works perfectly on all devices

## 🚀 Quick Start

1. Visit the website
2. Fill out the lesson form (topic, goals, student level)
3. Click "Generate Worksheet"
4. Preview and edit if needed
5. Download for $1 USD (both versions included)

No registration required for basic use.

## 💰 Pricing

- **Free**: Unlimited generation and online preview
- **$1 USD**: Download both Student and Teacher versions as HTML files
- Pay per download, no subscriptions

## 🎓 Perfect For

- Private English tutors
- Corporate language trainers  
- Language school teachers
- Online English instructors
- Anyone teaching English to adults

## 🛠 Technical Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI GPT for content generation
- **Payments**: Stripe integration
- **Deployment**: Lovable platform

## 📊 Current Status

**Version**: MVP v1.3 (Production Ready)
- ✅ Core worksheet generation
- ✅ Payment system
- ✅ Event tracking
- ✅ Mobile responsive
- ✅ Quality content generation
- ✅ **Latest fixes**: Audio and picture exercises in shared worksheets, PDF margins optimized, and Add Student modal form data persisting across browser tab switches.

## 🗺 Development Roadmap

### Stage 1: MVP Optimization (Current)
- Performance improvements
- Enhanced user experience
- A/B testing framework

### Stage 2: User Accounts & Profiles (Next)
- Teacher registration
- Student profile management
- Personalized content generation

### Future Stages
- Student testing and assessment
- Batch worksheet creation
- AI curriculum planning
- Calendar integration
- Multimedia content
- Community features

See [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) for detailed plans.

## 📚 Documentation

- [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) - Complete technical guide
- [User Guide (Short)](docs/USER_GUIDE_SHORT.md) - Quick start for new users
- [User Guide (Detailed)](docs/USER_GUIDE_DETAILED.md) - Comprehensive user manual
- [Business Analysis](docs/BUSINESS_ANALYSIS.md) - Market analysis and projections
- [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) - Future development plans

## 🔧 Development

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key
- Stripe account

### Setup
```bash
# Clone repository
git clone <repository-url>
cd english-worksheet-generator

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
Required in Supabase Edge Function secrets:
- `OPENAI_API_KEY` - OpenAI API authentication
- `STRIPE_SECRET_KEY` - Stripe payment processing

## 🌟 Key Differentiators

- **Adult-Focused Content**: No childish themes or exercises
- **AI-Powered Personalization**: Each worksheet is uniquely generated
- **Professional Quality**: Print-ready, publication-quality materials
- **Teacher-Centric Design**: Built by understanding real teaching workflows
- **No Subscription Lock-in**: Pay only when you download

## 📈 Success Metrics

- **User Satisfaction**: 4.5+ star average rating
- **Conversion Rate**: 25%+ generation-to-payment
- **Time Savings**: 30-60 minutes per worksheet vs manual creation
- **Global Reach**: Users in 15+ countries

## 🤝 Contributing

This is a commercial project. For feature requests or bug reports, please contact the development team.

## 📄 License

Proprietary software. All rights reserved.

## 📞 Support

For technical issues, billing questions, or feature requests:
- Check the [User Guide](docs/USER_GUIDE_DETAILED.md)
- Review [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)
- Contact support through the payment receipt information

---

**Built with ❤️ for English teachers worldwide**

*Making quality educational content creation fast, affordable, and accessible.*
