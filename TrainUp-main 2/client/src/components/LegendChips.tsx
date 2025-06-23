const colors = { Field:'#b5f23d', Gym:'#547aff', Match:'#ff6f6f', ACWR:'#facc15' };

export default function LegendChips({keys, acwrLine=false}:{keys:string[],acwrLine?:boolean}) {
  return (
    <div className="flex justify-center gap-3 mt-1 text-[11px] font-medium">
      {keys.map(k=>(
        <span key={k} className="flex items-center gap-1">
          {k==='ACWR'
            ? <span className="w-3 h-px bg-[#facc15] inline-block"></span>
            : <span className="w-3 h-2" style={{background:colors[k as keyof typeof colors]}}/>
          }
          {k}
        </span>
      ))}
    </div>
  );
}