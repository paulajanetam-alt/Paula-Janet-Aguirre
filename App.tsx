
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, X, CheckCircle2, ExternalLink, Globe, 
  LayoutDashboard, Grid3X3, CalendarRange, 
  Activity, FileText, Info, Link as LinkIcon, 
  Check, AlertTriangle, Lightbulb, Download, FileCode,
  Shield, User, Settings, Save, Edit3, Disc, Filter,
  RefreshCw, Crown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { instrumentos } from './data';
import { Instrumento } from './types';

// --- CONSTANTS & CONFIG ---
const AXIS_ORDER = [
  'Bienestar Basado en la Interculturalidad',
  'Territorio Adaptativo e Inteligente',
  'Competitividad Sostenible',
  'Transversal'
];

// URL de la imagen de Visión Cali 500+ (Placeholder o la del usuario)
const VISION_IMAGE_URL = "https://page.gensparksite.com/v1/base64_upload/541d3fc08c32ac0f13337a65ac9f8875"; 

// Colores Institucionales
const CALI = {
    MORADO: '#52227C',
    TURQUESA: '#00C9B7',
    VERDE: '#8BC53F',
    AMARILLO: '#FFD93D',
    ROSA: '#FF6B9D',
    GRIS_MEDIO: '#9E9E9E'
};

const COLORS = [CALI.MORADO, CALI.TURQUESA, CALI.VERDE, CALI.AMARILLO, CALI.ROSA, '#9C27B0', '#E91E63'];

const STATUS_COLORS: Record<string, string> = {
  'En Ejecución': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'En Actualización': 'bg-amber-100 text-amber-700 border-amber-200',
  'Permanente': 'bg-blue-100 text-blue-700 border-blue-200',
  'En proyecto': 'bg-violet-100 text-violet-700 border-violet-200',
  'Finalizada': 'bg-slate-100 text-slate-700 border-slate-200',
  'Finalizado': 'bg-slate-100 text-slate-700 border-slate-200'
};

const STATUS_BORDER_COLORS: Record<string, string> = {
  'En Ejecución': 'border-l-emerald-500',
  'En Actualización': 'border-l-amber-500',
  'Permanente': 'border-l-blue-500',
  'En proyecto': 'border-l-violet-500',
  'Finalizada': 'border-l-slate-500',
  'Finalizado': 'border-l-slate-500'
};

// --- HELPERS ---
const calculateProgress = (start: number, end: number | string) => {
    if (typeof end !== 'number') return 0; // Para 'Permanente' u otros strings
    const currentYear = new Date().getFullYear();
    
    if (currentYear < start) return 0;
    if (currentYear > end) return 100;
    
    const totalDuration = end - start;
    if (totalDuration <= 0) return 100;
    
    const elapsed = currentYear - start;
    return Math.round((elapsed / totalDuration) * 100);
};

// --- COMPONENTS ---

const KpiCard = ({ title, value, icon }: any) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform duration-300">
        <div className="text-2xl mb-2">{icon}</div>
        <div className={`text-3xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-br from-[${CALI.MORADO}] to-[${CALI.TURQUESA}]`} 
             style={{ backgroundImage: `linear-gradient(135deg, ${CALI.MORADO}, ${CALI.TURQUESA})` }}>
            {value}
        </div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</div>
    </div>
);

const StatusBox = ({ label, count, colorCode, bgGradient }: any) => (
    <div className="rounded-lg p-4 flex flex-col items-center justify-center border-2 transition-all hover:-translate-y-1 hover:shadow-lg h-full"
         style={{ borderColor: colorCode, background: bgGradient }}>
        <span className="text-3xl font-bold leading-none mb-2" style={{ color: colorCode }}>{count}</span>
        <span className="text-[10px] font-bold uppercase text-center tracking-wide" style={{ color: colorCode, filter: 'brightness(0.8)' }}>{label}</span>
    </div>
);

const AnalysisBox = ({ type, title, items }: { type: 'critico' | 'oportunidad' | 'alerta' | 'info', title: string, items: string[] }) => {
    const styles = {
        critico: { border: CALI.ROSA, bg: '#fff5f7' },
        oportunidad: { border: CALI.VERDE, bg: '#f5fff5' },
        alerta: { border: CALI.AMARILLO, bg: '#fffef5' },
        info: { border: CALI.TURQUESA, bg: '#f0fdf4' }
    };
    
    const style = styles[type] || styles.info;

    return (
        <div className="p-4 rounded-md border-l-4 bg-slate-50" style={{ borderLeftColor: style.border, backgroundColor: style.bg }}>
            <h4 className="text-sm font-bold mb-3" style={{ color: CALI.MORADO }}>{title}</h4>
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="text-xs text-slate-700 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400">
                        <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

const CircularMap = ({ instruments, onSelect }: { instruments: Instrumento[], onSelect: (inst: Instrumento) => void }) => {
    const [hoveredItem, setHoveredItem] = useState<{ inst: Instrumento, x: number, y: number } | null>(null);
    const [hoveredHorizon, setHoveredHorizon] = useState<string | null>(null);
    const [hoveredSector, setHoveredSector] = useState<string | null>(null);
    
    // Filtros locales para el mapa
    const [selectedAxes, setSelectedAxes] = useState<string[]>(AXIS_ORDER);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    
    const allTypes = useMemo(() => Array.from(new Set(instruments.map(i => i.tipo))), [instruments]);

    useEffect(() => {
        setSelectedTypes(allTypes);
    }, [allTypes]);

    const toggleAxis = (axis: string) => {
        if (selectedAxes.includes(axis)) {
            setSelectedAxes(selectedAxes.filter(a => a !== axis));
        } else {
            setSelectedAxes([...selectedAxes, axis]);
        }
    };

    const toggleType = (type: string) => {
        if (selectedTypes.includes(type)) {
            setSelectedTypes(selectedTypes.filter(t => t !== type));
        } else {
            setSelectedTypes([...selectedTypes, type]);
        }
    };

    // Configuration for rings
    const CENTER = { x: 400, y: 400 };
    const RADII = {
        center: 65,
        corto: { min: 100, max: 170, fixed: 180 },
        mediano: { min: 210, max: 280, fixed: 290 },
        largo: { min: 320, max: 390, fixed: 380 }
    };

    // Configuración de Ejes con Nombres Cortos y Colores de Texto Legibles
    const AXIS_SECTORS: Record<string, { start: number, end: number, color: string, labelX: number, labelY: number, displayName: string, textColor: string }> = {
        'Bienestar Basado en la Interculturalidad': { 
            start: -Math.PI/2, end: 0, color: CALI.MORADO, labelX: 650, labelY: 150, 
            displayName: "BIENESTAR", textColor: "#3b0764" 
        },
        'Territorio Adaptativo e Inteligente': { 
            start: 0, end: Math.PI/2, color: CALI.TURQUESA, labelX: 650, labelY: 650, 
            displayName: "TERRITORIO INTELIGENTE", textColor: "#0f766e" 
        },
        'Competitividad Sostenible': { 
            start: Math.PI/2, end: Math.PI, color: CALI.AMARILLO, labelX: 150, labelY: 650, 
            displayName: "COMPETITIVIDAD", textColor: "#b45309" // Ámbar oscuro para leer sobre blanco
        },
        'Transversal': { 
            start: Math.PI, end: 3*Math.PI/2, color: CALI.ROSA, labelX: 150, labelY: 150, 
            displayName: "TRANSVERSAL", textColor: "#be185d" 
        }
    };

    const nodes = useMemo(() => {
        const groups: Record<string, Instrumento[]> = {};
        
        instruments.forEach(inst => {
            let horizon = 'corto';
            const endYear = typeof inst.fin === 'number' ? inst.fin : 9999;
            if (endYear <= 2027) horizon = 'corto';
            else if (endYear <= 2036) horizon = 'mediano';
            else horizon = 'largo';
            
            const key = `${inst.eje}-${horizon}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(inst);
        });

        const newNodes: any[] = [];
        
        Object.entries(groups).forEach(([key, groupItems]) => {
            const [eje, horizon] = key.split('-');
            const sector = AXIS_SECTORS[eje] || { start: 0, end: 2*Math.PI, color: '#ccc' };
            
            const fixedR = RADII[horizon as 'corto'|'mediano'|'largo'].fixed;
            
            const sectorSpan = sector.end - sector.start;
            const step = sectorSpan / (groupItems.length + 1); 
            
            groupItems.forEach((inst, index) => {
                const angle = sector.start + (step * (index + 1));
                const x = CENTER.x + fixedR * Math.cos(angle);
                const y = CENTER.y + fixedR * Math.sin(angle);

                const color = sector.color;

                newNodes.push({
                    ...inst,
                    x,
                    y,
                    color,
                    horizon,
                    visible: selectedAxes.includes(inst.eje) && selectedTypes.includes(inst.tipo)
                });
            });
        });
        
        return newNodes;
    }, [instruments, selectedAxes, selectedTypes]); 

    return (
        <div className="flex h-full bg-slate-50">
            {/* Left Side: Map */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 fade-in relative overflow-hidden">
                 <div className="relative w-full max-w-4xl aspect-square bg-white rounded-[2rem] p-4 shadow-lg border border-slate-100 mx-auto">
                     <svg viewBox="0 0 800 800" className="w-full h-full font-sans select-none">
                        <defs>
                            <radialGradient id="gradCenter" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                <stop offset="0%" stopColor="#4ade80" />
                                <stop offset="100%" stopColor="#16a34a" />
                            </radialGradient>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* --- LAYOUT BACKGROUND --- */}
                        
                        {/* Sector Background Highlights (Focus Mode) */}
                        {Object.entries(AXIS_SECTORS).map(([name, sector], i) => (
                            <path 
                                key={name}
                                d={`M 400 400 L ${400 + 400*Math.cos(sector.start)} ${400 + 400*Math.sin(sector.start)} A 400 400 0 0 1 ${400 + 400*Math.cos(sector.end)} ${400 + 400*Math.sin(sector.end)} Z`}
                                fill={sector.color}
                                opacity={hoveredItem?.inst.eje === name || hoveredSector === name ? 0.1 : 0.02}
                                className="transition-opacity duration-500"
                            />
                        ))}

                        {/* Concentric Rings */}
                        <g>
                            <circle 
                                cx="400" cy="400" r="180" 
                                fill="none" 
                                stroke={hoveredItem?.inst.horizon === 'corto' || hoveredHorizon === 'corto' ? CALI.VERDE : "#cbd5e1"} 
                                strokeWidth={hoveredItem?.inst.horizon === 'corto' || hoveredHorizon === 'corto' ? 2 : 1} 
                                strokeDasharray={hoveredItem?.inst.horizon === 'corto' || hoveredHorizon === 'corto' ? "0" : "6 4"}
                                className="transition-all duration-300"
                            />
                             <circle 
                                cx="400" cy="400" r="290" 
                                fill="none" 
                                stroke={hoveredItem?.inst.horizon === 'mediano' || hoveredHorizon === 'mediano' ? CALI.AMARILLO : "#cbd5e1"} 
                                strokeWidth={hoveredItem?.inst.horizon === 'mediano' || hoveredHorizon === 'mediano' ? 2 : 1} 
                                strokeDasharray={hoveredItem?.inst.horizon === 'mediano' || hoveredHorizon === 'mediano' ? "0" : "6 4"}
                                className="transition-all duration-300"
                            />
                             <circle 
                                cx="400" cy="400" r="380" 
                                fill="none" 
                                stroke={hoveredItem?.inst.horizon === 'largo' || hoveredHorizon === 'largo' ? CALI.TURQUESA : "#cbd5e1"} 
                                strokeWidth={hoveredItem?.inst.horizon === 'largo' || hoveredHorizon === 'largo' ? 2 : 1} 
                                className="transition-all duration-300"
                                opacity="0.6"
                            />
                        </g>

                        {/* Axis Labels Improved */}
                        {Object.entries(AXIS_SECTORS).map(([name, sector]) => (
                            <g key={name} opacity={hoveredItem?.inst.eje === name || hoveredSector === name ? 1 : 0.85} className="transition-opacity duration-300">
                                {/* Background Pill for Readability */}
                                <rect 
                                    x={sector.labelX - 80} 
                                    y={sector.labelY - 14} 
                                    width="160" 
                                    height="28" 
                                    rx="14" 
                                    fill="white" 
                                    stroke={sector.color} 
                                    strokeWidth="1.5"
                                    className="shadow-sm"
                                />
                                {/* Text */}
                                <text 
                                    x={sector.labelX} 
                                    y={sector.labelY} 
                                    fill={sector.textColor}
                                    fontSize="11" 
                                    fontWeight="800" 
                                    textAnchor="middle"
                                    dy=".35em"
                                    className="uppercase tracking-wider font-sans"
                                >
                                    {sector.displayName}
                                </text>
                            </g>
                        ))}

                        {/* Horizon Labels */}
                        <text x="400" y="210" textAnchor="middle" className="text-[10px] fill-slate-500 font-bold uppercase tracking-widest bg-white/50">Corto Plazo</text>
                        <text x="400" y="100" textAnchor="middle" className="text-[10px] fill-slate-500 font-bold uppercase tracking-widest">Mediano Plazo</text>
                        <text x="400" y="10" textAnchor="middle" className="text-[10px] fill-slate-500 font-bold uppercase tracking-widest">Largo Plazo</text>

                        {/* Center POAI */}
                        <g className="cursor-pointer hover:scale-105 transition-transform duration-300">
                            <circle cx="400" cy="400" r="65" fill="white" stroke="#e2e8f0" strokeWidth="1" />
                            <circle cx="400" cy="400" r="60" fill="url(#gradCenter)" filter="url(#glow)" className="shadow-lg" />
                            <text x="400" y="400" textAnchor="middle" dy=".3em" fill="white" fontWeight="bold" fontSize="22" style={{textShadow: '0px 2px 4px rgba(0,0,0,0.2)'}}>POAI</text>
                        </g>

                        {/* Nodes */}
                        {nodes.map((node, i) => {
                            const isHovered = hoveredItem?.inst.id === node.id;
                            const isDimmed = hoveredItem && !isHovered;
                            const isVisionPlan = node.id === 100; 
                            
                            return (
                                <g 
                                    key={i} 
                                    className={`cursor-pointer transition-all duration-500 ${node.visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                                    onMouseEnter={() => node.visible && setHoveredItem({ inst: node, x: node.x, y: node.y })}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    onClick={() => node.visible && onSelect(node)}
                                    style={{ opacity: isDimmed ? 0.3 : 1 }}
                                >
                                    <circle 
                                        cx={node.x} cy={node.y} 
                                        r={isHovered ? (isVisionPlan ? 45 : 20) : 0} 
                                        fill={node.color} 
                                        opacity="0.2" 
                                        className="transition-all duration-300"
                                    />
                                    
                                    {isVisionPlan ? (
                                        <g>
                                            <circle 
                                                cx={node.x} cy={node.y} 
                                                r={isHovered ? 40 : 36} 
                                                fill="white"
                                                stroke={CALI.MORADO} strokeWidth="2" 
                                                className="shadow-xl transition-all duration-300" 
                                            />
                                            <image 
                                                href={VISION_IMAGE_URL}
                                                x={node.x - (isHovered ? 28 : 25)}
                                                y={node.y - (isHovered ? 28 : 25)}
                                                width={isHovered ? 56 : 50}
                                                height={isHovered ? 56 : 50}
                                                preserveAspectRatio="xMidYMid meet"
                                                className="pointer-events-none"
                                            />
                                            <circle 
                                                cx={node.x} cy={node.y} 
                                                r={42} 
                                                fill="none" 
                                                stroke={CALI.MORADO} 
                                                strokeWidth="1" 
                                                opacity="0.3"
                                                className="animate-pulse pointer-events-none" 
                                            />
                                        </g>
                                    ) : (
                                        <circle 
                                            cx={node.x} cy={node.y} 
                                            r={isHovered ? 10 : 7} 
                                            fill={node.color} 
                                            stroke="white" strokeWidth="2" 
                                            className="shadow-md transition-all duration-300" 
                                        />
                                    )}
                                    
                                    {isHovered && (
                                        <circle cx={node.x} cy={node.y} r={isVisionPlan ? 45 : 14} fill="none" stroke={node.color} strokeWidth="1" className="animate-ping opacity-75" />
                                    )}
                                </g>
                            );
                        })}
                     </svg>

                     {/* Interactive Tooltip */}
                     {hoveredItem && (
                         <div 
                            className="absolute z-50 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-100 w-72 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-20px] animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden"
                            style={{ 
                                left: `${(hoveredItem.x / 800) * 100}%`, 
                                top: `${(hoveredItem.y / 800) * 100}%` 
                            }}
                         >
                             {hoveredItem.inst.id === 100 ? (
                                 <div className="bg-gradient-to-r from-indigo-900 to-purple-800 p-3 text-white flex items-center justify-between">
                                     <div className="flex items-center gap-2">
                                         <Crown className="h-4 w-4 text-amber-400" />
                                         <span className="text-xs font-bold tracking-widest uppercase">PLAN RECTOR 2050</span>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="p-4 pb-0 flex items-center justify-between mb-2">
                                     <span className="text-[10px] font-extrabold uppercase tracking-widest py-1 px-2 rounded-md text-white shadow-sm" style={{backgroundColor: hoveredItem.inst.color}}>
                                         {hoveredItem.inst.horizon === 'corto' ? 'Corto Plazo' : hoveredItem.inst.horizon === 'mediano' ? 'Mediano Plazo' : 'Largo Plazo'}
                                     </span>
                                     <span className="text-[10px] font-bold text-slate-400">ID: {hoveredItem.inst.id}</span>
                                 </div>
                             )}
                             
                             <div className="p-4 pt-0 mt-3">
                                <h4 className="font-bold text-slate-800 text-sm leading-snug mb-3 border-b border-slate-100 pb-2">
                                    {hoveredItem.inst.nombre}
                                </h4>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="font-semibold text-slate-700">Vigencia: </span>
                                        <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{hoveredItem.inst.inicio} - {hoveredItem.inst.fin}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Activity className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                                        <div>
                                            <span className="font-semibold text-slate-700">Eje Estratégico: </span>
                                            <span className="text-slate-600 block mt-0.5 leading-tight">{hoveredItem.inst.eje}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                                    <span className="text-[10px] text-indigo-500 font-bold flex items-center justify-center gap-1">
                                        Click para ver detalles <ExternalLink className="h-3 w-3" />
                                    </span>
                                </div>
                             </div>
                         </div>
                     )}
                 </div>
            </div>

            {/* Right Side: Enhanced Filters & Legend */}
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-10">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                        <Filter className="h-5 w-5 text-indigo-600" />
                        Filtros Interactivos
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Pasa el mouse sobre las opciones para resaltar en el mapa.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* Horizon Legend (Interactive) */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CalendarRange className="h-3 w-3" /> Temporalidad
                        </h3>
                        <div className="space-y-2">
                            {[
                                { id: 'corto', label: 'Corto Plazo (2024-2027)', color: CALI.VERDE },
                                { id: 'mediano', label: 'Mediano Plazo (2028-2036)', color: CALI.AMARILLO },
                                { id: 'largo', label: 'Largo Plazo (2037-2050+)', color: CALI.TURQUESA }
                            ].map(horizon => (
                                <div 
                                    key={horizon.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-all group"
                                    onMouseEnter={() => setHoveredHorizon(horizon.id)}
                                    onMouseLeave={() => setHoveredHorizon(null)}
                                >
                                    <div className={`w-3 h-3 rounded-full ring-2 ring-white shadow-sm transition-transform group-hover:scale-125`} style={{backgroundColor: horizon.color}}></div>
                                    <span className={`text-xs font-medium transition-colors ${hoveredHorizon === horizon.id ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                                        {horizon.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Axis Filter (Interactive) */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Grid3X3 className="h-3 w-3" /> Ejes Estratégicos
                        </h3>
                        <div className="space-y-2">
                            {AXIS_ORDER.map(axis => {
                                const color = AXIS_SECTORS[axis]?.color;
                                return (
                                    <div 
                                        key={axis} 
                                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-all"
                                        onMouseEnter={() => setHoveredSector(axis)}
                                        onMouseLeave={() => setHoveredSector(null)}
                                        onClick={() => toggleAxis(axis)}
                                    >
                                        <div className={`mt-0.5 relative flex items-center justify-center w-4 h-4 rounded border transition-colors ${selectedAxes.includes(axis) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                            {selectedAxes.includes(axis) && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <span className={`text-xs block leading-tight transition-colors ${selectedAxes.includes(axis) ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                                {axis}
                                            </span>
                                            <div className="h-0.5 w-0 group-hover:w-full bg-indigo-600/20 mt-1 transition-all duration-500 rounded-full" style={{backgroundColor: color}}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <hr className="border-slate-100" />

                    {/* Type Filter */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText className="h-3 w-3" /> Tipo de Instrumento
                        </h3>
                        <div className="space-y-2">
                            {allTypes.map(type => (
                                <label key={type} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                                    <div className={`relative flex items-center justify-center w-4 h-4 rounded border transition-colors ${selectedTypes.includes(type) ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedTypes.includes(type)}
                                            onChange={() => toggleType(type)}
                                            className="absolute opacity-0 w-full h-full cursor-pointer"
                                        />
                                        {selectedTypes.includes(type) && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className={`text-xs font-medium transition-colors ${selectedTypes.includes(type) ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {type}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InstrumentDrawer = ({ 
    instrument, 
    onClose, 
    role, 
    onUpdate 
}: { 
    instrument: Instrumento | null, 
    onClose: () => void, 
    role: 'usuario' | 'administrador',
    onUpdate: (updated: Instrumento) => void
}) => {
    const [editData, setEditData] = useState<Instrumento | null>(null);

    useEffect(() => {
        setEditData(instrument);
    }, [instrument]);

    if (!instrument || !editData) return null;

    const handleToggle = (field: keyof Instrumento, value: string) => {
        const newData = { ...editData, [field]: value };
        setEditData(newData);
    };

    const handleInputChange = (field: keyof Instrumento, value: string) => {
        setEditData({ ...editData, [field]: value });
    };

    const handleSave = () => {
        if (editData) {
            onUpdate(editData);
            onClose();
        }
    };

    return (
        <>
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300" onClick={onClose} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col slide-in-right">
             <div className="h-44 relative shrink-0 overflow-hidden" style={{ backgroundColor: CALI.MORADO }}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-[#1E1B4B] opacity-50"></div>
                {/* Abstract shapes */}
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute left-10 bottom-10 h-20 w-20 rounded-full bg-cyan-500/10 blur-xl"></div>
                
                <div className="relative h-full p-6 flex flex-col justify-end text-white">
                   <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"><X className="h-5 w-5" /></button>
                   <div className="flex flex-wrap gap-2 mb-3">
                     <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 border border-white/10 backdrop-blur-sm">ID: {editData.id}</span>
                     <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 backdrop-blur-sm">{editData.tipo}</span>
                   </div>
                   <h2 className="text-xl font-bold leading-tight">{editData.nombre}</h2>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar">
                
                {/* --- ADMIN EDIT PANEL --- */}
                {role === 'administrador' && (
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2 text-indigo-800 font-bold text-sm border-b border-indigo-200 pb-2">
                            <Settings className="h-4 w-4" />
                            Panel de Gestión (Administrador)
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleToggle('seguimiento', editData.seguimiento === 'Si' ? 'No' : 'Si')}
                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${editData.seguimiento === 'Si' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                            >
                                {editData.seguimiento === 'Si' ? '✓ Con Seguimiento' : '✗ Sin Seguimiento'}
                            </button>
                            <button 
                                onClick={() => handleToggle('observatorio', editData.observatorio === 'Observatorio' || editData.observatorio === 'Si' ? '' : 'Observatorio')}
                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${editData.observatorio ? 'bg-violet-100 border-violet-300 text-violet-800' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                            >
                                {editData.observatorio ? '✓ Con Observatorio' : '✗ Sin Observatorio'}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600">Enlace Documento (URL)</label>
                            <input 
                                type="text" 
                                value={editData.enlace || ''} 
                                onChange={(e) => handleInputChange('enlace', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600">Enlace PDF (URL)</label>
                            <input 
                                type="text" 
                                value={editData.pdf_informe || ''} 
                                onChange={(e) => handleInputChange('pdf_informe', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>

                        <button 
                            onClick={handleSave}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                            <Save className="h-4 w-4" />
                            Guardar Cambios
                        </button>
                    </div>
                )}

                {/* --- INFO DISPLAY --- */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                   <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Vigencia</span>
                      <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {editData.inicio} - {editData.fin}
                      </span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                           <span className="text-xs text-slate-400 block mb-1">Estado</span>
                           <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block ${STATUS_COLORS[editData.estado]}`}>
                             {editData.estado}
                           </span>
                        </div>
                        <div>
                           <span className="text-xs text-slate-400 block mb-1">Temporalidad</span>
                           <span className="text-sm font-medium text-slate-700">{editData.temporalidad}</span>
                        </div>
                   </div>

                   <div className="pt-2">
                        <span className="text-xs text-slate-400 block mb-1">Eje Estratégico</span>
                        <div className="font-medium text-slate-800 text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                            {editData.eje}
                        </div>
                   </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-indigo-500" /> 
                        Seguimiento y Monitoreo
                    </h4>
                    
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">¿Requiere seguimiento?</span>
                            {editData.seguimiento === 'Si' ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> SI
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                    No aplica
                                </span>
                            )}
                        </div>
                        
                        {editData.observatorio && (
                            <div className="pt-3 border-t border-slate-100">
                                <span className="text-xs text-slate-400 block mb-1">Mecanismo / Observatorio Asociado</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                  <span className="text-sm font-medium text-slate-700">{editData.observatorio}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {editData.enlace && (
                   <a 
                     href={editData.enlace} 
                     target="_blank" 
                     rel="noreferrer" 
                     className="group flex items-center justify-center gap-2 w-full p-4 rounded-xl text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg transform hover:-translate-y-0.5"
                     style={{ backgroundColor: CALI.TURQUESA }}
                   >
                      Acceder al Instrumento / Observatorio
                      <ExternalLink className="h-4 w-4 group-hover:ml-1 transition-all" />
                   </a>
                )}
                
                {editData.pdf_informe && (
                   <a 
                     href={editData.pdf_informe} 
                     target="_blank" 
                     rel="noreferrer" 
                     className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors hover:border-slate-300"
                   >
                      <FileText className="h-4 w-4 text-rose-500" /> Ver Documento PDF
                   </a>
                )}
             </div>
          </div>
        </>
    );
};

const App: React.FC = () => {
  // --- STATE ---
  // Initialize with persisted data if available
  const [instrumentsData, setInstrumentsData] = useState<Instrumento[]>(() => {
    const savedData = localStorage.getItem('cali500_instruments');
    return savedData ? JSON.parse(savedData) : instrumentos;
  });
  
  const [currentView, setCurrentView] = useState<'analitica' | 'ecosistema' | 'mapa'>('analitica');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrumento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEje, setFilterEje] = useState('Todos');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [userRole, setUserRole] = useState<'usuario' | 'administrador'>('usuario'); 
  
  const exportRef = useRef<HTMLDivElement>(null);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('cali500_instruments', JSON.stringify(instrumentsData));
  }, [instrumentsData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- ACTIONS ---
  const handleUpdateInstrument = (updated: Instrumento) => {
    setInstrumentsData(prevData => 
        prevData.map(item => item.id === updated.id ? updated : item)
    );
  };
  
  const handleResetData = () => {
      if(window.confirm('¿Estás seguro de restablecer los datos originales? Se perderán tus cambios locales.')) {
          setInstrumentsData(instrumentos);
          localStorage.removeItem('cali500_instruments');
      }
  };

  // --- DATA PROCESSING ---
  const filteredData = useMemo(() => {
    return instrumentsData.filter(item => {
      const matchesSearch = 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.id).includes(searchTerm);
      const matchesEje = filterEje === 'Todos' || item.eje === filterEje;
      return matchesSearch && matchesEje;
    });
  }, [searchTerm, filterEje, instrumentsData]);

  const stats = useMemo(() => {
    const sourceData = filteredData;
    const total = sourceData.length;
    const conSeguimiento = sourceData.filter(i => i.seguimiento === 'Si').length;
    const sinSeguimiento = sourceData.filter(i => i.seguimiento !== 'Si').length;
    const cobertura = total > 0 ? ((conSeguimiento / total) * 100).toFixed(1) : 0;

    // Unificar estados para las tarjetas
    const estadosMap: Record<string, number> = {
        'Permanente': 0,
        'En Ejecución': 0,
        'En Actualización': 0,
        'Finalizado': 0
    };
    
    sourceData.forEach(i => {
        let st = i.estado;
        if (st === 'En Revision') st = 'En Actualización';
        if (st === 'Finalizada') st = 'Finalizado';
        if (estadosMap[st] !== undefined) estadosMap[st]++;
    });

    const byType = Object.entries(sourceData.reduce((acc, curr) => {
        acc[curr.tipo] = (acc[curr.tipo] || 0) + 1;
        return acc;
    }, {} as Record<string, number>)).map(([name, value]) => ({ name, value: Number(value) })).sort((a, b) => b.value - a.value);

    const byEje = AXIS_ORDER.map(eje => ({
        name: eje,
        shortName: eje.split(' ')[0],
        count: sourceData.filter(i => i.eje === eje).length
    }));

    return {
      total,
      conSeguimiento,
      sinSeguimiento,
      cobertura,
      estadosMap,
      byType,
      byEje
    };
  }, [filteredData]);

  const groupedData = useMemo(() => {
    const groups: Record<string, Instrumento[]> = {};
    AXIS_ORDER.forEach(axis => groups[axis] = []);
    filteredData.forEach(item => {
      if (!groups[item.eje]) groups[item.eje] = [];
      groups[item.eje].push(item);
    });
    return groups;
  }, [filteredData]);

  const handleExportPDF = () => {
    setShowExportMenu(false);
    window.print();
  };

  const handleExportHTML = () => {
    setShowExportMenu(false);
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision-cali-500-reporte-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-48 text-white flex flex-col shrink-0 z-20 shadow-2xl transition-all no-print" style={{backgroundColor: '#1E1B4B'}}>
        <div className="p-4 pb-2 flex flex-col items-center">
          {/* Vision Logo Image */}
          <img 
            src={VISION_IMAGE_URL} 
            alt="Visión Cali 500+" 
            className="w-full h-auto object-contain rounded-xl mb-2 hover:scale-105 transition-transform duration-300"
          />
        </div>

        <nav className="flex-1 px-2 py-2 space-y-1">
           {[
             { id: 'analitica', icon: LayoutDashboard, label: 'Analítica' },
             { id: 'ecosistema', icon: Grid3X3, label: 'Ecosistema' },
             { id: 'mapa', icon: Disc, label: 'Mapa Circular' },
           ].map(item => (
             <button 
               key={item.id}
               onClick={() => setCurrentView(item.id as any)}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden ${
                 currentView === item.id 
                   ? 'text-white shadow-lg' 
                   : 'text-indigo-200 hover:bg-white/5 hover:text-white'
               }`}
               style={currentView === item.id ? { backgroundColor: CALI.MORADO } : {}}
             >
               <item.icon className={`h-4 w-4 ${currentView === item.id ? 'text-white' : 'text-indigo-400 group-hover:text-white transition-colors'}`} />
               <span className="font-medium text-xs relative z-10">{item.label}</span>
               {currentView === item.id && <div className="absolute right-0 top-0 bottom-0 w-1" style={{backgroundColor: CALI.TURQUESA}}></div>}
             </button>
           ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="rounded-lg p-3 border border-indigo-500/20 backdrop-blur-sm bg-indigo-900/40 space-y-2">
            <div className="flex items-start gap-2">
                <Info className="h-3 w-3 shrink-0 mt-0.5" style={{color: CALI.TURQUESA}} />
                <p className="text-[9px] text-indigo-200 leading-relaxed font-medium">
                  <strong className="text-white">{instrumentsData.length} instrumentos</strong>.
                </p>
            </div>
            {userRole === 'administrador' && (
                <button 
                    onClick={handleResetData}
                    className="w-full flex items-center justify-center gap-2 px-2 py-1.5 mt-2 text-[9px] bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded border border-red-500/30 transition-colors"
                >
                    <RefreshCw className="h-3 w-3" /> Restaurar
                </button>
            )}
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-slate-50/50">
        
        {/* Top Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0 print:h-auto print:border-none print:static">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
              {currentView === 'analitica' && <div className="p-2 bg-indigo-100 rounded-lg no-print"><LayoutDashboard className="h-5 w-5" style={{color: CALI.MORADO}} /></div>}
              {currentView === 'ecosistema' && <div className="p-2 bg-indigo-100 rounded-lg no-print"><Grid3X3 className="h-5 w-5" style={{color: CALI.MORADO}} /></div>}
              {currentView === 'mapa' && <div className="p-2 bg-indigo-100 rounded-lg no-print"><Disc className="h-5 w-5" style={{color: CALI.MORADO}} /></div>}
              
              <span>
                {currentView === 'analitica' && 'Diagnóstico y Analítica de Gestión'}
                {currentView === 'ecosistema' && 'Ecosistema de Planificación'}
                {currentView === 'mapa' && 'Mapa Circular de Horizontes'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 ml-12 no-print">Sistema de Planeación Distrital de Santiago de Cali</p>
            {/* Timestamp for Print */}
            <p className="text-xs text-slate-400 mt-1 print-only">
                Reporte Generado: {new Date().toLocaleDateString()} | Visión Cali 500+
            </p>
          </div>
          
          {/* Controls Container - Hidden in Print */}
          <div className="flex items-center gap-4 no-print">
               <div className="flex items-center gap-3 fade-in">
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Buscar instrumento..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full w-64 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm" 
                    />
                  </div>
                  <div className="h-8 w-px bg-slate-200 mx-1"></div>
                  <div className="flex gap-2">
                      <select className="bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg px-3 py-2 outline-none hover:border-indigo-300 focus:border-indigo-500 shadow-sm cursor-pointer" value={filterEje} onChange={(e) => setFilterEje(e.target.value)}>
                      <option value="Todos">Todos los Ejes</option>{AXIS_ORDER.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                  </div>
               </div>
            
            {/* Export Dropdown */}
            <div className="relative" ref={exportRef}>
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm border border-indigo-200"
                >
                    <Download className="h-4 w-4" />
                    Exportar
                </button>

                {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button 
                            onClick={handleExportPDF}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors text-sm text-slate-700"
                        >
                            <FileText className="h-4 w-4 text-rose-500" />
                            Guardar como PDF
                        </button>
                        <div className="h-px bg-slate-100"></div>
                        <button 
                            onClick={handleExportHTML}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors text-sm text-slate-700"
                        >
                            <FileCode className="h-4 w-4 text-emerald-500" />
                            Guardar como HTML
                        </button>
                    </div>
                )}
            </div>
          </div>
        </header>

        {/* Scrollable View Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth relative custom-scrollbar">
            
            {/* --- VIEW: ANALITICA (DIAGNÓSTICO COMPLETO) --- */}
            {currentView === 'analitica' && (
              <div className="space-y-6 max-w-[1600px] mx-auto fade-in">
                 
                 {/* 1. KPI CARDS */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard title="Total Instrumentos" value={stats.total} icon={<FileText className="h-8 w-8 mx-auto text-slate-300" />} />
                    <KpiCard title="Con Seguimiento" value={stats.conSeguimiento} icon={<CheckCircle2 className="h-8 w-8 mx-auto text-emerald-300" />} />
                    <KpiCard title="Sin Seguimiento" value={stats.sinSeguimiento} icon={<AlertTriangle className="h-8 w-8 mx-auto text-rose-300" />} />
                    <KpiCard title="Cobertura Seguimiento" value={`${stats.cobertura}%`} icon={<Activity className="h-8 w-8 mx-auto text-indigo-300" />} />
                 </div>

                 {/* 2. CHARTS GRID */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Chart 1 */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-[320px] flex flex-col">
                       <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{color: CALI.MORADO}}>
                         📊 Distribución por Tipo de Documento
                       </h3>
                       <div className="flex-1">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={stats.byType} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} />
                             <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                             <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {stats.byType.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                             </Bar>
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Chart 2 */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-[320px] flex flex-col">
                       <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{color: CALI.MORADO}}>
                         🎯 Distribución por Eje Estratégico
                       </h3>
                       <div className="flex-1">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={stats.byEje} margin={{top: 20, bottom: 20}}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="shortName" tick={false} axisLine={false} />
                             <YAxis />
                             <Tooltip contentStyle={{borderRadius: '8px'}} />
                             <Bar dataKey="count" fill={CALI.TURQUESA} radius={[4, 4, 0, 0]} barSize={50} />
                           </BarChart>
                         </ResponsiveContainer>
                         <div className="flex justify-around text-[10px] text-slate-400 mt-2 font-medium text-center">
                            <span>Bienestar</span>
                            <span>Territorio</span>
                            <span>Competitividad</span>
                            <span>Transv.</span>
                         </div>
                       </div>
                    </div>

                    {/* Chart 3 */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-[320px] flex flex-col">
                       <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{color: CALI.MORADO}}>
                         ✅ Distribución por Estado
                       </h3>
                       <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1">
                           <StatusBox 
                              label="Permanente" 
                              count={stats.estadosMap['Permanente']} 
                              colorCode={CALI.VERDE} 
                              bgGradient="linear-gradient(135deg, #f0f9e8, #ffffff)" 
                           />
                           <StatusBox 
                              label="En Ejecución" 
                              count={stats.estadosMap['En Ejecución']} 
                              colorCode={CALI.TURQUESA} 
                              bgGradient="linear-gradient(135deg, #e0f7f5, #ffffff)" 
                           />
                           <StatusBox 
                              label="En Actualización" 
                              count={stats.estadosMap['En Actualización']} 
                              colorCode={CALI.AMARILLO} 
                              bgGradient="linear-gradient(135deg, #fff9e6, #ffffff)" 
                           />
                           <StatusBox 
                              label="Finalizado" 
                              count={stats.estadosMap['Finalizado']} 
                              colorCode={CALI.ROSA} 
                              bgGradient="linear-gradient(135deg, #ffe8f0, #ffffff)" 
                           />
                       </div>
                    </div>

                    {/* Chart 4 */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-[320px] flex flex-col">
                       <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{color: CALI.MORADO}}>
                         📈 Seguimiento
                       </h3>
                       <div className="flex-1 relative">
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie
                               data={[
                                   {name: 'Con Seguimiento', value: stats.conSeguimiento}, 
                                   {name: 'Sin Seguimiento', value: stats.sinSeguimiento}
                               ]}
                               innerRadius={60}
                               outerRadius={90}
                               paddingAngle={2}
                               dataKey="value"
                             >
                               <Cell fill={CALI.VERDE} />
                               <Cell fill={CALI.ROSA} />
                             </Pie>
                             <Tooltip />
                             <Legend verticalAlign="bottom" height={36} />
                           </PieChart>
                         </ResponsiveContainer>
                       </div>
                    </div>
                 </div>

                 {/* 3. EXECUTIVE ANALYSIS */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold mb-6 pb-2 border-b-4" style={{color: CALI.MORADO, borderColor: CALI.MORADO}}>
                        🔍 Análisis Ejecutivo y Hallazgos Clave
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnalysisBox 
                            type="critico"
                            title="⚠️ HALLAZGOS CRÍTICOS"
                            items={[
                                `<strong>${((stats.sinSeguimiento/stats.total)*100).toFixed(1)}% sin seguimiento:</strong> ${stats.sinSeguimiento} instrumentos carecen de sistema de monitoreo.`,
                                `<strong>${stats.estadosMap['En Actualización']} instrumentos en actualización:</strong> Requieren atención prioritaria (ej: POT y Marco Fiscal).`,
                                `<strong>${stats.estadosMap['Finalizado']} instrumentos finalizados:</strong> Requieren actualización urgente o cierre.`
                            ]}
                        />
                        <AnalysisBox 
                            type="alerta"
                            title="📊 CONCENTRACIÓN Y RETOS DE ARTICULACIÓN"
                            items={[
                                "<strong>Alta concentración en Bienestar:</strong> La mayoría de los instrumentos están enfocados en el eje de Bienestar Intercultural.",
                                "<strong>Reto de Competitividad:</strong> Menor número de instrumentos dedicados específicamente al eje de Competitividad Sostenible.",
                                "<strong>Articulación POAI:</strong> El reto es lograr que los proyectos y estrategias queden incluidos en el presupuesto de cada vigencia."
                            ]}
                        />
                        <AnalysisBox 
                            type="oportunidad"
                            title="✅ FORTALEZAS IDENTIFICADAS"
                            items={[
                                `<strong>${stats.cobertura}% con seguimiento:</strong> ${stats.conSeguimiento} instrumentos cuentan con monitoreo.`,
                                `<strong>${stats.estadosMap['En Ejecución']} en ejecución activa:</strong> Mayoría operativa según cronograma.`,
                                "<strong>Visión de largo plazo:</strong> Múltiples instrumentos alineados a la visión 2036/2050."
                            ]}
                        />
                         <div className="p-4 rounded-md border-l-4 bg-slate-50" style={{ borderLeftColor: CALI.TURQUESA, backgroundColor: '#f0fdf4' }}>
                            <h4 className="text-sm font-bold mb-3" style={{ color: CALI.MORADO }}>🎯 RECOMENDACIONES PARA LA ARTICULACIÓN</h4>
                            <ul className="space-y-2">
                                <li className="text-xs text-slate-700 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400">
                                    <strong>Sistema integrado de seguimiento:</strong> Implementar monitoreo en los instrumentos faltantes.
                                </li>
                                <li className="text-xs text-slate-700 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400">
                                    <strong>Coordinación de actualizaciones:</strong> Los instrumentos en actualización deben guardar coherencia entre sí.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 p-4 rounded-lg text-white text-sm font-medium text-center leading-relaxed shadow-md"
                         style={{ background: `linear-gradient(135deg, ${CALI.MORADO}, ${CALI.TURQUESA})` }}>
                        <Lightbulb className="inline h-4 w-4 mr-2 mb-0.5" />
                        <strong>INSIGHT CLAVE:</strong> La Visión Cali 500+ requiere que la planificación se articule para que estrategias, acciones y proyectos estén alineados. El Seguimiento de los diferentes instrumentos debe ser integral y permitir que los Planes Trasciendan los periodos de gobierno.
                    </div>
                 </div>
              </div>
            )}

            {/* --- VIEW: ECOSISTEMA --- */}
            {currentView === 'ecosistema' && (
              <div className="space-y-6 fade-in pb-20">
                
                {/* Role Toggle for Ecosystem */}
                <div className="flex justify-center mb-8 no-print">
                    <div className="bg-white p-1 rounded-full border border-slate-200 shadow-sm flex relative">
                        <button 
                            onClick={() => setUserRole('usuario')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${userRole === 'usuario' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <User className="h-4 w-4" />
                            Vista Ciudadana
                        </button>
                        <button 
                            onClick={() => setUserRole('administrador')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${userRole === 'administrador' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Shield className="h-4 w-4" />
                            Gestión (Admin)
                        </button>
                    </div>
                </div>

                {AXIS_ORDER.map((axis) => {
                  const items = groupedData[axis];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={axis} className="space-y-4">
                      <div className="text-white px-5 py-3 rounded-lg flex items-center justify-between shadow-md" style={{backgroundColor: '#312E81'}}>
                          <div className="flex items-center gap-3">
                             <div className="w-3 h-3 rounded-full bg-white/20 ring-2 ring-white/10"></div>
                             <h2 className="font-bold text-lg tracking-wide">{axis}</h2>
                          </div>
                          <span className="text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm" style={{backgroundColor: CALI.TURQUESA}}>{items.length} instrumentos</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                          {items.map(item => {
                            const progress = calculateProgress(item.inicio, item.fin);
                            return (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedInstrument(item)} 
                                className={`
                                    bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer 
                                    flex flex-col p-4 relative overflow-hidden group
                                    ${STATUS_BORDER_COLORS[item.estado] || 'border-l-slate-300'} border-l-4
                                `}
                            >
                              {/* Admin Indicator */}
                              {userRole === 'administrador' && (
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="p-1.5 bg-indigo-50 rounded-full text-indigo-600">
                                          <Edit3 className="h-3.5 w-3.5" />
                                      </div>
                                  </div>
                              )}

                              <h3 className="font-bold text-sm mb-3 line-clamp-2 h-10 leading-tight" style={{color: '#312E81'}} title={item.nombre}>
                                {item.nombre}
                              </h3>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full" style={{backgroundColor: CALI.TURQUESA}}>
                                  {item.tipo.split(' ')[0]}
                                </span>
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                                  {item.inicio} - {item.fin}
                                </span>
                              </div>

                              <div className="flex gap-2 mb-5">
                                 {item.seguimiento === 'Si' ? (
                                   <span className="text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm" style={{backgroundColor: '#84CC16'}}>
                                     <Check className="h-3 w-3" /> Seg.
                                   </span>
                                 ) : (
                                   <span className="bg-slate-200 text-slate-500 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 opacity-60">
                                     Seg.
                                   </span>
                                 )}
                                 
                                 {item.observatorio ? (
                                   <span className="text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm" style={{backgroundColor: '#4C1D95'}}>
                                     Obs. <LinkIcon className="h-3 w-3" />
                                   </span>
                                 ) : (
                                   <span className="bg-slate-200 text-slate-500 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 opacity-60">
                                     Obs.
                                   </span>
                                 )}
                              </div>

                              <div className="mt-auto">
                                <div className="flex justify-between items-end text-xs text-slate-400 mb-1">
                                  <span className="font-medium">{item.estado}</span>
                                  <span className="font-mono">{progress}%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-slate-300 transition-all duration-1000" style={{width: `${progress}%`, backgroundColor: CALI.VERDE}}></div>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- VIEW: MAPA CIRCULAR --- */}
            {currentView === 'mapa' && (
                <CircularMap 
                    instruments={filteredData} 
                    onSelect={setSelectedInstrument} 
                />
            )}

        </div>

      </main>

      {/* --- DRAWER --- */}
      <InstrumentDrawer 
        instrument={selectedInstrument} 
        onClose={() => setSelectedInstrument(null)} 
        role={userRole}
        onUpdate={handleUpdateInstrument}
      />

    </div>
  );
};

export default App;
