# StreamFlow Clone

A modern DeFi streaming platform built on Solana that enables token streaming, vesting schedules, and automated payment flows.

## 🌟 Features

- **Token Streaming**: Create continuous token streams with customizable parameters
- **Vesting Schedules**: Set up linear and cliff vesting for team tokens and investor allocations
- **Multi-Token Support**: Stream any SPL token with real-time rate calculations
- **Automated Payments**: Schedule recurring payments with flexible intervals
- **Stream Management**: Pause, resume, cancel, and modify active streams
- **Real-time Analytics**: Track streaming metrics and payment history
- **Wallet Integration**: Seamless connection with popular Solana wallets

## 🚀 Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with Glassmorphism design
- **Blockchain**: Solana Web3.js & Anchor Framework
- **UI Components**: Shadcn/ui with custom theming
- **Charts**: Recharts for data visualization
- **Wallet**: Solana Wallet Adapter
- **State Management**: React hooks with Context API

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/streamflow-clone.git
cd streamflow-clone
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_PROGRAM_ID=your_program_id_here
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🎨 Design System

### Color Palette
- **Primary**: #6366f1 (Indigo)
- **Secondary**: #8b5cf6 (Purple)
- **Accent**: #10b981 (Emerald)
- **Background**: #0f172a (Slate)
- **Text**: #f1f5f9 (Light Slate)

### Typography
- **Font Family**: Inter
- **Base Size**: 16px
- **Scale**: Tailwind's default type scale

### Components
- **Cards**: Glassmorphism effect with dark backgrounds
- **Buttons**: Purple-to-indigo gradients with hover animations
- **Border Radius**: 0.75rem (12px) for consistent rounded corners
- **Grid System**: 24px spacing for consistent layouts

## 🏗️ Project Structure

```
streamflow-clone/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   ├── streams/           # Stream management
│   ├── analytics/         # Analytics and reporting
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui components
│   ├── charts/           # Chart components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   ├── solana/           # Solana-specific utilities
│   ├── utils.ts          # General utilities
│   └── constants.ts      # App constants
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🔧 Key Components

### Stream Creation
- **StreamForm**: Create new token streams with customizable parameters
- **TokenSelector**: Choose from available SPL tokens
- **RecipientInput**: Add single or multiple recipients
- **ScheduleBuilder**: Set up streaming schedules and vesting periods

### Stream Management
- **StreamList**: View and manage active streams
- **StreamDetails**: Detailed view of individual streams
- **StreamControls**: Pause, resume, cancel, and modify streams
- **WithdrawInterface**: Claim available tokens from streams

### Analytics
- **StreamMetrics**: Real-time streaming statistics
- **PaymentHistory**: Historical payment data and charts
- **TokenFlowChart**: Visualize token flow over time
- **PerformanceDashboard**: Track streaming performance metrics

## 🔐 Security Features

- **Wallet Verification**: Secure wallet connection and signature verification
- **Transaction Validation**: Client-side transaction validation before submission
- **Error Handling**: Comprehensive error handling for blockchain interactions
- **Rate Limiting**: Protection against excessive API calls
- **Input Sanitization**: Secure handling of user inputs

## 📊 Supported Operations

### Stream Operations
- Create linear vesting streams
- Create cliff vesting with unlock schedules
- Set up recurring payment streams
- Batch create multiple streams
- Cancel streams with refund calculations
- Modify stream parameters (where applicable)

### Token Management
- Support for all SPL tokens
- Real-time token price feeds
- Token balance tracking
- Multi-token portfolio view
- Token approval management

### Payment Features
- Automated payment execution
- Flexible payment intervals (daily, weekly, monthly)
- Payment history and receipts
- Failed payment retry mechanisms
- Payment notification system

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Manual Deployment
```bash
npm run build
npm run start
```

### Docker Deployment
```bash
docker build -t streamflow-clone .
docker run -p 3000:3000 streamflow-clone
```

## 🧪 Testing

Run the test suite:
```bash
npm run test
# or
yarn test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for any API changes
- Ensure all tests pass before submitting PR
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: [docs.streamflow-clone.com](https://docs.streamflow-clone.com)
- **Discord**: [Join our community](https://discord.gg/streamflow-clone)
- **Twitter**: [@StreamFlowClone](https://twitter.com/StreamFlowClone)
- **Email**: support@streamflow-clone.com

## 🙏 Acknowledgments

- [StreamFlow Protocol](https://streamflow.finance) for inspiration
- [Solana Foundation](https://solana.org) for the blockchain infrastructure
- [Shadcn/ui](https://ui.shadcn.com) for the component library
- [Tailwind CSS](https://tailwindcss.com) for the styling framework

## 🔄 Changelog

### v1.0.0 (Latest)
- Initial release with core streaming functionality
- Glassmorphism UI design implementation
- Multi-wallet support
- Real-time analytics dashboard
- Comprehensive stream management tools

---

Built with ❤️ for the Solana ecosystem