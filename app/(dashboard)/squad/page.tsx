import Image from "next/image";

export default function SquadPage() {
  return (
    <div className="mx-auto max-w-6xl w-full flex items-center justify-center min-h-[calc(100vh-140px)] animate-in fade-in duration-500">
      
      {/* Main Terminal Card */}
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-[#0a0d10] shadow-2xl flex flex-col md:flex-row">
        
        {/* Left Side: Content Panel */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border">
          
          {/* Top Badges */}
          <div className="flex items-center gap-3 mb-10">
            <span className="inline-flex items-center rounded bg-accentGreen/10 px-2.5 py-1 text-[9px] font-mono font-medium tracking-widest text-accentGreen uppercase border border-accentGreen/20">
              Network: P2P_MESH
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-5xl font-serif text-t1 leading-tight mb-6">
            Squad Intelligence:
            <br />
            <span className="text-accentGreen">Coming Soon</span>
          </h1>

          {/* Body Text */}
          <p className="text-sm md:text-base text-t2 leading-relaxed mb-10 max-w-md">
            Connect with other analysts, share alpha, and coordinate your farming
            strategies in real-time.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <button className="w-full sm:w-auto px-8 py-3.5 bg-accentGreen hover:bg-[#00e68f] text-background font-mono text-sm font-medium rounded-lg transition-colors cursor-not-allowed opacity-90">
              Join the Waitlist
            </button>
            <button className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-border hover:border-t3 text-t1 font-mono text-sm font-medium rounded-lg transition-colors cursor-not-allowed">
              View Whitepaper
            </button>
          </div>

          {/* Waitlist Counter */}
          <div className="flex items-center gap-4 mt-auto">
            {/* Abstract Avatars */}
            <div className="flex items-center -space-x-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#0a0d10] bg-surface flex items-center justify-center overflow-hidden">
                <svg className="w-5 h-5 text-t3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[#0a0d10] bg-elevated flex items-center justify-center overflow-hidden">
                <svg className="w-5 h-5 text-t3 opacity-80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[#0a0d10] bg-border flex items-center justify-center z-10">
                <span className="text-[9px] font-mono text-accentGreen">+42</span>
              </div>
            </div>
            <span className="text-xs text-t2 font-medium">
              4,209 analysts waiting for deployment
            </span>
          </div>

        </div>

        {/* Right Side: Telemetry / Visual Data */}
        <div className="flex-1 relative bg-[#06080a] p-8 md:p-12 flex flex-col justify-end overflow-hidden">
          
          {/* Grid lines overlay (optional cyber effect) */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03]" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px' 
            }}
          />

          {/* Generated Constellation Background Image */}
          <div className="absolute inset-0 w-full h-[60%] top-0">
            <Image
              src="/images/squad_network.png"
              alt="Network Mesh"
              fill
              className="object-cover object-center opacity-70 mix-blend-screen"
              priority
            />
            {/* Soft fade at the bottom of the image so it blends into the black background */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#06080a] to-transparent" />
          </div>

          {/* Telemetry Widgets (Z-10 keeps them above the image fading) */}
          <div className="relative z-10 w-full space-y-4">
            
            {/* Progress Bar Widget */}
            <div className="border border-border bg-[#0a0d10]/80 rounded-lg p-5 backdrop-blur-md">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] font-mono text-t3 tracking-widest uppercase">
                  Latency_Ping
                </span>
                <span className="text-[10px] font-mono text-t2 tracking-widest">
                  9.0ms
                </span>
              </div>
              {/* Progress Track */}
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accentGreen rounded-full relative" 
                  style={{ width: '85%' }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-12 bg-white/20 blur-[2px] animate-pulse" />
                </div>
              </div>
            </div>

            {/* Stat Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border bg-[#0a0d10]/80 rounded-lg p-5 backdrop-blur-md flex flex-col justify-center">
                <span className="text-[9px] font-mono text-t3 tracking-widest uppercase mb-2">
                  Active Nodes
                </span>
                <span className="text-xl font-mono text-t1 font-medium">
                  8,912
                </span>
              </div>
              
              <div className="border border-border bg-[#0a0d10]/80 rounded-lg p-5 backdrop-blur-md flex flex-col justify-center">
                <span className="text-[9px] font-mono text-t3 tracking-widest uppercase mb-2">
                  Signal Strength
                </span>
                <span className="text-xl font-mono text-accentGreen font-medium tracking-tight">
                  OPTIMAL
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
