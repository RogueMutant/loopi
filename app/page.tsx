import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ConnectButton } from '@/components/ConnectButton';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Loopi | The Ultimate Web3 Campaign & Bounty Platform',
  description: 'The score that separates signal from noise. Loopi scores Web3 bounties by expected ROI.',
};

const TICKER_ITEMS = [
  <div key="1">SUPERTEAM EARN <span className="text-accentGreen font-medium">92 / 100</span></div>,
  <div key="2">GALXE CAMPAIGNS <span className="text-accentGreen font-medium">+2,841</span> active</div>,
  <div key="3">ZAMA $FDV <span className="text-accentRed">-56%</span> post-TGE</div>,
  <div key="4">AZTEC NETWORK <span className="text-accentRed">-51%</span> post-TGE</div>,
  <div key="5">AVG CAMPAIGN EV <span className="text-accentGreen font-medium">$340</span></div>,
  <div key="6">SENTIENT $FDV <span className="text-accentRed">-47%</span></div>,
  <div key="7">LOOPI SCORE ACCURACY <span className="text-accentGreen font-medium">91%</span></div>,
];

// Duplicate items to ensure smooth infinite scrolling for 50% translation.
// We need enough items to guarantee the track is at least 2x any reasonable screen width.
const RENDER_TICKER = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

const LIVE_ITEMS = [
  { score: 92, scoreColor: "text-accentGreen", title: "Solana Mobile Chapter 2 Pre-order", proto: "SUPERTEAM · BOUNTY · $500" },
  { score: 87, scoreColor: "text-accentGreen", title: "Sybil Resistance Audit Alpha", proto: "AETHERIA · BOUNTY · $12,500" },
  { score: 78, scoreColor: "text-accentAmber", title: "Ethena Labs sUSDe Liquidity Report", proto: "ETHENA · INFOFI · $1,200" },
  { score: 64, scoreColor: "text-accentAmber", title: "Berachain Artio Faucet Monitoring", proto: "BERACHAIN · ON-CHAIN · $250" },
  { score: 91, scoreColor: "text-accentGreen", title: "GenLayer Builder Program Q2", proto: "GENLAYER · ON-CHAIN · FREE" },
  { score: 31, scoreColor: "text-accentRed", title: "SENTIENT Community Campaign", proto: "SENTIENT · INFOFI · $800" },
];

const RENDER_LIVE = [...LIVE_ITEMS, ...LIVE_ITEMS, ...LIVE_ITEMS, ...LIVE_ITEMS, ...LIVE_ITEMS, ...LIVE_ITEMS];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-t1 font-sans selection:bg-accentGreen/30 flex flex-col">
      
      {/* TICKER */}
      <div className="bg-surface border-b-[0.5px] border-border overflow-hidden h-8 flex items-center">
        <div className="flex gap-0 animate-tick w-max hover:[animation-play-state:paused]">
          {RENDER_TICKER.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-8 whitespace-nowrap font-mono text-[11px] text-t3 border-r-[0.5px] border-border">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav className="bg-background border-b-[0.5px] border-border h-14 flex items-center px-10 gap-10">
        <div className="font-mono text-lg font-medium text-accentGreen tracking-[-0.02em] mr-auto">Loopi_</div>
        <div className="hidden md:flex gap-7">
          <Link href="/feed" className="font-sans text-[13px] text-t3 no-underline tracking-[0.01em] hover:text-t1 transition-colors">Feed</Link>
          <a href="#how-it-works" className="font-sans text-[13px] text-t3 no-underline tracking-[0.01em] hover:text-t1 transition-colors">How it works</a>
          <a href="#" className="font-sans text-[13px] text-t3 no-underline tracking-[0.01em] hover:text-t1 transition-colors">For protocols</a>
          <a href="#creators" className="font-sans text-[13px] text-t3 no-underline tracking-[0.01em] hover:text-t1 transition-colors">Creators</a>
        </div>
        <ConnectButton variant="nav" />
      </nav>

      {/* HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[580px] border-b-[0.5px] border-border">
        {/* Left */}
        <div className="p-10 md:p-16 flex flex-col justify-center border-b-[0.5px] lg:border-b-0 lg:border-r-[0.5px] border-border">
          <div className="font-mono text-[11px] text-accentGreen tracking-[0.1em] uppercase mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accentGreen"></div>
            The sovereign analyst
          </div>
          <h1 className="font-serif italic text-5xl md:text-[52px] leading-[1.1] text-t1 mb-5 tracking-[-0.02em]">
            The score that separates<br className="hidden md:block" /> <span className="not-italic text-accentGreen">signal</span> from noise.
          </h1>
          <p className="font-sans text-[15px] text-t3 leading-[1.7] max-w-[400px] mb-9">
            Every Web3 campaign scored 0–100 by expected ROI, competition density, effort required, and founder trust — before you waste a single hour on it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center mb-12">
            <ConnectButton />
            <a href="#how-it-works" className="w-full sm:w-auto">
              <button className="w-full font-sans text-[13px] text-t2 bg-transparent border-[0.5px] border-border-strong px-5 py-3 rounded-lg cursor-pointer hover:bg-surface transition-colors">
                See how it works
              </button>
            </a>
          </div>
          <div className="flex gap-8 pt-6 border-t-[0.5px] border-border">
            <div>
              <div className="font-mono text-[22px] font-medium text-t1">4</div>
              <div className="font-sans text-[11px] text-t3 mt-0.5 uppercase tracking-[0.06em]">signals per score</div>
            </div>
            <div>
              <div className="font-mono text-[22px] font-medium text-t1">6h</div>
              <div className="font-sans text-[11px] text-t3 mt-0.5 uppercase tracking-[0.06em]">refresh cycle</div>
            </div>
            <div>
              <div className="font-mono text-[22px] font-medium text-t1">$0</div>
              <div className="font-sans text-[11px] text-t3 mt-0.5 uppercase tracking-[0.06em]">cost to start</div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="bg-surface relative flex items-center justify-center overflow-hidden min-h-[400px]">
          {/* Scan Lines - Placed first to stay under cards */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="scan-line-x" style={{ animation: 'scan-x 20s linear infinite, scan-pulse 4s ease-in-out infinite' }}></div>
            <div className="scan-line-y" style={{ animation: 'scan-y 25s linear infinite, scan-pulse-y 5s ease-in-out infinite' }}></div>
          </div>

          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle, #21262D 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative w-[340px] h-[340px] scale-90 md:scale-100">
            {/* Big Ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <svg className="overflow-visible" width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="#161B22" strokeWidth="6"/>
                <circle cx="80" cy="80" r="68" fill="none" stroke="#00D282" strokeWidth="6" strokeDasharray="240 320" strokeLinecap="round" transform="rotate(-90 80 80)"/>
                <text x="80" y="72" textAnchor="middle" className="font-mono text-4xl font-medium" fill="#00D282">87</text>
                <text x="80" y="95" textAnchor="middle" className="font-sans text-[11px] tracking-[1px]" fill="#7D8590">OPPORTUNITY</text>
                <text x="80" y="108" textAnchor="middle" className="font-sans text-[11px] tracking-[1px]" fill="#7D8590">SCORE</text>
              </svg>
            </div>
            
            {/* Float Cards */}
            <div className="absolute top-5 right-2 backdrop-blur-md bg-background/90 border-[0.5px] border-border rounded-xl px-3.5 py-2.5 whitespace-nowrap shadow-lg">
              <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.07em] mb-1">Reward EV</div>
              <div className="font-mono text-[13px] font-medium text-accentGreen">$340 / entry</div>
            </div>
            <div className="absolute bottom-10 left-0 backdrop-blur-md bg-background/90 border-[0.5px] border-border rounded-xl px-3.5 py-2.5 whitespace-nowrap shadow-lg">
              <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.07em] mb-1">Founder trust</div>
              <div className="font-mono text-[13px] font-medium text-accentGreen">95 / 100</div>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-5 backdrop-blur-md bg-background/90 border-[0.5px] border-border rounded-xl px-3.5 py-2.5 whitespace-nowrap shadow-lg">
              <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.07em] mb-1">Competition</div>
              <div className="font-mono text-[13px] font-medium text-accentAmber">Medium</div>
            </div>
            <div className="absolute top-2.5 left-5 backdrop-blur-md bg-background/90 border-[0.5px] border-border rounded-xl px-3.5 py-2.5 whitespace-nowrap shadow-lg">
              <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.07em] mb-1">Effort</div>
              <div className="font-mono text-[13px] font-medium text-accentBlue">Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE STRIP */}
      <div className="border-b-[0.5px] border-border overflow-hidden h-[44px] flex items-center bg-background relative">
        {/* Sticky Label */}
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-background px-5 border-r-[0.5px] border-border shadow-[10px_0_20px_-10px_rgba(5,13,9,1)]">
          <span className="font-mono text-[10px] text-accentGreen uppercase tracking-[0.1em] whitespace-nowrap">Live feed</span>
        </div>
        
        {/* Marquee Track */}
        <div className="flex gap-0 animate-tick-slow w-max ml-[100px] hover:[animation-play-state:paused]">
          {RENDER_LIVE.map((item, idx) => (
            <div key={`live-${idx}`} className="flex items-center gap-2.5 px-6 border-r-[0.5px] border-border h-[44px]">
              <span className={`font-mono text-[13px] font-medium ${item.scoreColor}`}>{item.score}</span>
              <div className="flex flex-col justify-center">
                <div className="font-sans text-[12px] text-t2 leading-tight">{item.title}</div>
                <div className="font-mono text-[10px] text-t3 leading-tight mt-0.5">{item.proto}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INTELLIGENCE SECTION */}
      <div className="px-6 md:px-10 py-20 border-b-[0.5px] border-border max-w-7xl mx-auto w-full">
        <div className="font-mono text-[10px] text-accentGreen uppercase tracking-[0.1em] mb-4">01 — The intelligence</div>
        <h2 className="font-serif italic text-[38px] text-t1 leading-[1.15] tracking-[-0.02em] mb-3">
          One number.<br/>Four signals.
        </h2>
        <p className="font-sans text-[14px] text-t3 leading-[1.7] max-w-[480px]">
          Every score is computed from four independently weighted dimensions. The algorithm never lies. The founders sometimes do.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-[0.5px] border-border rounded-xl overflow-hidden mt-12">
          {/* Cell 1 */}
          <div className="p-7 border-b-[0.5px] border-border md:border-r-[0.5px]">
            <div className="font-mono text-[11px] text-t3 mb-2.5 tracking-[0.04em]">01 — 30% weight</div>
            <div className="font-mono text-[18px] font-medium text-accentGreen mb-1">Reward EV</div>
            <div className="font-sans text-[15px] font-medium text-t1 mb-1.5">Expected value per entry</div>
            <div className="font-sans text-[13px] text-t3 leading-[1.6] mb-3.5">
              Pool size divided by estimated winner count, normalised against every campaign in the feed. A $500 pool with 10 entries beats a $5,000 pool with 500.
            </div>
            <div className="h-[3px] bg-border rounded-sm overflow-hidden"><div className="h-full bg-accentGreen rounded-sm" style={{width: '85%'}}></div></div>
          </div>
          {/* Cell 2 */}
          <div className="p-7 border-b-[0.5px] border-border">
            <div className="font-mono text-[11px] text-t3 mb-2.5 tracking-[0.04em]">02 — 25% weight</div>
            <div className="font-mono text-[18px] font-medium text-accentBlue mb-1">Effort</div>
            <div className="font-sans text-[15px] font-medium text-t1 mb-1.5">Inverse — lower effort scores higher</div>
            <div className="font-sans text-[13px] text-t3 leading-[1.6] mb-3.5">
              A thread contest takes 20 minutes. A security audit takes a week. Effort is auto-classified by AI on every new campaign so you never have to read the brief first.
            </div>
            <div className="h-[3px] bg-border rounded-sm overflow-hidden"><div className="h-full bg-accentBlue rounded-sm" style={{width: '100%'}}></div></div>
          </div>
          {/* Cell 3 */}
          <div className="p-7 border-b-[0.5px] border-border md:border-b-0 md:border-r-[0.5px]">
            <div className="font-mono text-[11px] text-t3 mb-2.5 tracking-[0.04em]">03 — 25% weight</div>
            <div className="font-mono text-[18px] font-medium text-accentAmber mb-1">Timing</div>
            <div className="font-sans text-[15px] font-medium text-t1 mb-1.5">Entry density vs. time remaining</div>
            <div className="font-sans text-[13px] text-t3 leading-[1.6] mb-3.5">
              Entry count divided by days remaining. Being early is the single largest predictor of above-median returns. The premium tier shows you campaigns 48 hours before everyone else.
            </div>
            <div className="h-[3px] bg-border rounded-sm overflow-hidden"><div className="h-full bg-accentAmber rounded-sm" style={{width: '70%'}}></div></div>
          </div>
          {/* Cell 4 */}
          <div className="p-7">
            <div className="font-mono text-[11px] text-t3 mb-2.5 tracking-[0.04em]">04 — 20% weight</div>
            <div className="font-mono text-[18px] font-medium text-accentRed mb-1">Founder trust</div>
            <div className="font-sans text-[15px] font-medium text-t1 mb-1.5">The risk filter</div>
            <div className="font-sans text-[13px] text-t3 leading-[1.6] mb-3.5">
              VC quality, rug history, KOL concentration, FDV gap. If a founder has rugged before, no reward size can make their campaign score above 40. The cap is non-negotiable.
            </div>
            <div className="h-[3px] bg-border rounded-sm overflow-hidden"><div className="h-full bg-accentRed rounded-sm" style={{width: '55%'}}></div></div>
          </div>
        </div>
      </div>

      {/* PROOF SECTION */}
      <div className="px-6 md:px-10 py-20 bg-surface border-b-[0.5px] border-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="font-mono text-[10px] text-accentRed uppercase tracking-[0.1em] mb-4">02 — The evidence</div>
          <h2 className="font-serif italic text-[38px] text-t1 leading-[1.15] tracking-[-0.02em] mb-3">
            The market<br/>leaves receipts.
          </h2>
          <p className="font-sans text-[14px] text-t3 leading-[1.7] max-w-[480px]">
            These are not hypothetical. Every one of these projects had the red flags before TGE. The signal existed. Most people just didn't have a system to read it.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-[0.5px] border-border rounded-xl overflow-hidden mt-10 bg-background">
            {[
              { name: "ZAMA", loss: "-56%", desc: "Bought at $0.05 ($550M FDV). Now trading at $0.01985. Tier-1 VCs, tier-1 exchanges. Didn't matter.", foot: "Raised $150M+ · Listed on Binance" },
              { name: "Aztec Network", loss: "-51%", desc: "a16z-led. Clearing price FDV $486M. Now $0.02224. The pre-market signal was there for those who looked.", foot: "Raised $119M · a16z + Coinbase" },
              { name: "MEGA", loss: "-52%", desc: "Listed pre-market at over $3B FDV. Now trading below $1.5B. The FDV gap was visible before the listing.", foot: "FDV gap: 2× on listing day" },
              { name: "SENTIENT", loss: "-47%", desc: "Pre-market over $1.5B FDV. Now below $800M. KOL concentration was extreme. Score would have been 31.", foot: "KOL concentration: critical" }
            ].map((proof, i) => (
              <div key={i} className="p-6 border-b-[0.5px] lg:border-b-0 lg:border-r-[0.5px] border-border last:border-0 sm:[&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r-[0.5px] flex flex-col">
                <div className="font-mono text-[11px] text-t3 uppercase tracking-[0.08em] mb-3">{proof.name}</div>
                <div className="font-mono text-4xl font-medium text-accentRed leading-none mb-1.5">{proof.loss}</div>
                <div className="font-sans text-[12px] text-t3 leading-[1.5] flex-1 min-h-[54px]">{proof.desc}</div>
                <div className="font-mono text-[13px] text-t2 mt-3 pt-2.5 border-t-[0.5px] border-border w-full">{proof.foot}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works" className="px-6 md:px-10 py-20 border-b-[0.5px] border-border">
        <div className="max-w-7xl mx-auto w-full">
          <div className="font-mono text-[10px] text-accentGreen uppercase tracking-[0.1em] mb-4">03 — How it works</div>
          <h2 className="font-serif italic text-[38px] text-t1 leading-[1.15] tracking-[-0.02em] mb-3">
            Built for the<br/>systematic farmer.
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-t-[0.5px] border-border mt-12">
            {/* Step 1 */}
            <div className="py-8 lg:py-8 lg:pr-8 border-b-[0.5px] lg:border-b-0 lg:border-r-[0.5px] border-border">
              <div className="font-mono text-[11px] text-accentGreen tracking-[0.08em] mb-4">01 — DISCOVER</div>
              <h3 className="font-serif italic text-[22px] text-t1 mb-2.5 leading-[1.2]">Every 6 hours, the feed updates itself.</h3>
              <p className="font-sans text-[13px] text-t3 leading-[1.7]">
                Loopi pulls campaigns from Superteam Earn, Galxe, WizzHQ, Cre8core, and on-chain programs automatically. You never need to scout. By the time your WhatsApp group shares a link, it's already been scored and ranked.
              </p>
            </div>
            {/* Step 2 */}
            <div className="py-8 lg:py-8 lg:px-8 border-b-[0.5px] lg:border-b-0 lg:border-r-[0.5px] border-border">
              <div className="font-mono text-[11px] text-accentGreen tracking-[0.08em] mb-4">02 — SCORE</div>
              <h3 className="font-serif italic text-[22px] text-t1 mb-2.5 leading-[1.2]">The algorithm runs before you open the app.</h3>
              <p className="font-sans text-[13px] text-t3 leading-[1.7]">
                Reward EV, effort level, entry timing, and founder trust are computed the moment a campaign is discovered. New protocols get a 10-minute manual trust review. Known protocols score instantly. The score is always there when you arrive.
              </p>
            </div>
            {/* Step 3 */}
            <div className="py-8 lg:py-8 lg:pl-8">
              <div className="font-mono text-[11px] text-accentGreen tracking-[0.08em] mb-4">03 — ACT</div>
              <h3 className="font-serif italic text-[22px] text-t1 mb-2.5 leading-[1.2]">Filter, track, complete. Repeat.</h3>
              <p className="font-sans text-[13px] text-t3 leading-[1.7]">
                Sort by score, filter by type, track which wallets you've used on which campaigns. Log completions and watch your earnings history grow. Your squad can coordinate referral chains from the same dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CREATOR SECTION */}
      <div id="creators" className="px-6 md:px-10 py-20 border-b-[0.5px] border-border flex justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center max-w-7xl w-full">
          <div>
            <div className="font-mono text-[10px] text-accentGreen uppercase tracking-[0.1em] mb-4">04 — For creators</div>
            <h2 className="font-serif italic text-[38px] text-t1 leading-[1.15] tracking-[-0.02em] mb-3">
              Your analysis.<br/>Our infrastructure.
            </h2>
            <p className="font-sans text-[14px] text-t3 leading-[1.7] mb-6">
              If you're already writing threads about which campaigns are worth pursuing, Loopi is the productised version of your work. Bring your audience. We'll handle the scoring, tracking, and payouts.
            </p>
            <p className="font-sans text-[13px] text-t3 leading-[1.7] mb-7">
              You earn 20–25% of every protocol listing fee generated by your referral link, paid monthly. A creator who brings in five campaigns per month at the average listing fee earns $400–$500 passively — before touching their own feed.
            </p>
            <button className="font-mono text-[13px] font-medium bg-accentGreen text-background border-none px-6 py-3 rounded-lg cursor-pointer tracking-[-0.01em] hover:bg-[#00e68f] transition-colors flex items-center justify-center gap-2">
              Apply as a creator
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-surface border-[0.5px] border-border rounded-xl h-[300px] flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #21262D 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <Image 
              src="/creator_apply_editorial.png"
              alt="Creator Hub illustration"
              className="object-cover absolute inset-0 w-full h-full opacity-60 mix-blend-screen group-hover:scale-105 transition-transform duration-700"
              width={600}
              height={300}
            />
            
            <div className="bg-background border-[0.5px] border-border rounded-xl px-5 py-3.5 text-center absolute bottom-5 right-5 shadow-2xl">
              <div className="font-mono text-2xl font-medium text-accentGreen">25%</div>
              <div className="font-sans text-[11px] text-t3 mt-0.5">commission rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 md:px-10 py-[100px] text-center border-b-[0.5px] border-border flex flex-col items-center">
        <div className="font-mono text-[10px] text-accentGreen uppercase tracking-[0.1em] mb-5">The sovereign analyst</div>
        <h2 className="font-serif italic text-5xl md:text-[52px] text-t1 tracking-[-0.02em] mb-4 leading-[1.1]">
          Stop scouting.<br/>Start scoring.
        </h2>
        <p className="font-sans text-[14px] text-t3 mb-8">
          Free to use. No email required. Connect your wallet and the feed is live.
        </p>
        <ConnectButton />
      </div>

      {/* FOOTER */}
      <footer className="px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="font-mono text-[15px] font-medium text-accentGreen">Loopi_</div>
        <div className="flex flex-wrap justify-center gap-5">
          <a href="/feed" className="font-sans text-[12px] text-t3 no-underline hover:text-t1 transition-colors">Feed</a>
          <a href="#" className="font-sans text-[12px] text-t3 no-underline hover:text-t1 transition-colors">Docs</a>
          <a href="#how-it-works" className="font-sans text-[12px] text-t3 no-underline hover:text-t1 transition-colors">How it works</a>
          <a href="#creators" className="font-sans text-[12px] text-t3 no-underline hover:text-t1 transition-colors">Creators</a>
          <a href="#" className="font-sans text-[12px] text-t3 no-underline hover:text-t1 transition-colors">X / Twitter</a>
        </div>
        <div className="font-mono text-[11px] text-t3">© {new Date().getFullYear()} Loopi · NFA</div>
      </footer>
    </div>
  );
}
