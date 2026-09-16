import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Save, Calendar, Building2, UserSquare2, 
  Building, GraduationCap, Users, Briefcase, UserCog, HeartHandshake, FileText,
  BarChart, PieChart, Maximize, BatteryCharging, LineChart, Users2, Wallet,
  Activity, LayoutGrid, TrendingUp, Gamepad2, ArrowRight, Trash2, Info,
  ChevronDown, Undo2, PaintBucket, Type, Combine, X, Eraser, Grid3X3, Columns, Rows, Image as ImageIcon,
  Shapes, Circle, Square, Triangle, ArrowLeft, ArrowUp, ArrowDown, Star,
  Bold, AlignLeft, AlignCenter, AlignRight, Plus, Minus, ZoomIn, ZoomOut, ChevronUp, Split, Eye, EyeOff, Edit2, Check
} from 'lucide-react';

interface ActiveSheetData {
  title: string;
  data: any[][];
  merges: XLSX.Range[];
  colWidths?: Record<number, number>;
  rowHeights?: Record<number, number>;
  colors: Record<string, { 
    bg?: string, 
    text?: string, 
    border?: string, 
    image?: string, 
    shape?: string,
    bold?: boolean,
    fontSize?: number,
    textAlign?: 'left' | 'center' | 'right'
  }>;
}

const PALETTE = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', // رمادي
  '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#991b1b', // أحمر
  '#fdba74', '#fb923c', '#f97316', '#ea580c', '#9a3412', // برتقالي
  '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#92400e', // أصفر/عنبري
  '#bef264', '#a3e635', '#84cc16', '#65a30d', '#3f6212', // أخضر ليموني
  '#86efac', '#4ade80', '#22c55e', '#16a34a', '#14532d', // أخضر
  '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#164e63', // سماوي
  '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1e3a8a', // أزرق
  '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#4c1d95', // بنفسجي
  '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#831843'  // وردي
];

function App() {
  // Authentication states
  const [user, setUser] = useState<{username: string, role: string, complex?: string} | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const COMPLEXES_LIST = [
    'دار القلم', 'رائدة السلام', 'رحاب المعرفة', 'أضواء الرياض النهضة',
    'أضواء الرياض القادسية', 'المدينة الأكاديمية', 'أسراري', 'السفراء',
    'دار البرائة', 'أجيال ينبع', 'نبع المعرفة', 'منارات ينبع',
    'دار الثقافة', 'نبع المواهب', 'العزيزية بالخبر'
  ];

  const COMPLEX_LOGOS: Record<string, string> = {
    'كل المجمعات': '/1000099843-removebg-preview.png',
    'دار القلم': '/1000099845-removebg-preview.png',
    'رحاب المعرفة': '/1000106495-removebg-preview.png',
    'أسراري': '/1000106498-removebg-preview.png',
    'السفراء': '/1000106499-removebg-preview.png',
    'المدينة الأكاديمية': '/1000106500-removebg-preview.png',
    'دار البرائة': '/1000106501-removebg-preview.png',
    'أضواء الرياض النهضة': '/1000106502-removebg-preview.png',
    'أضواء الرياض القادسية': '/1000106502-removebg-preview.png',
    'رائدة السلام': '/1000106503-removebg-preview.png',
    'نبع المعرفة': '/1000106504-removebg-preview.png',
    'منارات ينبع': '/1000106505-removebg-preview.png',
    'أجيال ينبع': '/1000106506-removebg-preview.png',
    'دار الثقافة': '/1000106507-removebg-preview.png',
    'نبع المواهب': '/1000106508-removebg-preview.png',
    'العزيزية بالخبر': '/1000106509-removebg-preview.png'
  };

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'users'>('profile');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addComplex, setAddComplex] = useState(COMPLEXES_LIST[0]);
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' });

  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({ username: '', password: '', complex: '' });

  // حالات تخزين اختيارات المستخدم
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [complexName, setComplexName] = useState('كل المجمعات');
  const [pathName, setPathName] = useState('أهلي');
  const [dataStatus, setDataStatus] = useState('الكل');
  
  // حالة اختيار الفئة (بيانات أو تقارير)
  const [selectedCategory, setSelectedCategory] = useState<'بيانات' | 'تقارير' | null>('بيانات');
  
  // حالة تخزين البيانات بعد الضغط على حفظ لعرضها
  const [savedData, setSavedData] = useState<{ complex: string; year: string; path: string } | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.complex) {
      setComplexName(user.complex);
    }
  }, [user]);

  // حالة عرض جدول الإكسيل
  const [activeSheet, setActiveSheet] = useState<ActiveSheetData | null>(null);
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  
  // حالة حفظ التعديلات الشاملة
  const [modifiedSheets, setModifiedSheets] = useState<Record<string, ActiveSheetData>>({});
  
  // حالات التعديلات والتحكم
  const [history, setHistory] = useState<ActiveSheetData[]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [menuRow, setMenuRow] = useState<number | null>(null);
  const [menuCol, setMenuCol] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{r: number, c: number, type: 'cell'|'col'|'row'} | null>(null);
  const [dragSnapshot, setDragSnapshot] = useState<Set<string>>(new Set());
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [resizing, setResizing] = useState<{type: 'col' | 'row', index: number, startPos: number, startSize: number} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const scrollAnimationRef = useRef<number>(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef(dragStart);
  const dragSnapshotRef = useRef(dragSnapshot);

  useEffect(() => { dragStartRef.current = dragStart; }, [dragStart]);
  useEffect(() => { dragSnapshotRef.current = dragSnapshot; }, [dragSnapshot]);

  const autoScroll = () => {
    if (isDraggingRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const { x, y } = lastMousePosRef.current;
      
      const scrollSpeed = 15;
      const threshold = 50; 
      
      // Scroll vertically
      if (y < rect.top + threshold) {
        container.scrollTop -= scrollSpeed;
      } else if (y > rect.bottom - threshold) {
        container.scrollTop += scrollSpeed;
      }
      
      // Scroll horizontally (RTL logic)
      if (x < rect.left + threshold) {
        container.scrollLeft -= scrollSpeed; 
      } else if (x > rect.right - threshold) {
        container.scrollLeft += scrollSpeed;
      }
      
      scrollAnimationRef.current = requestAnimationFrame(autoScroll);
    }
  };

  // إغلاق القوائم عند النقر خارجها وإنهاء السحب
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // إغلاق قوائم الصفوف والأعمدة
      setMenuRow(null);
      setMenuCol(null);
      
      // إغلاق قائمة الأشكال إذا نقر خارجها
      const target = e.target as HTMLElement;
      if (!target.closest('.shapes-menu-container')) {
        setShowShapesMenu(false);
      }
      if (!target.closest('.border-menu-container')) {
        setShowBorderMenu(false);
      }
    };
    
    const handleMouseUp = () => {
      setDragStart(null);
      setDragSnapshot(new Set());
      isDraggingRef.current = false;
      cancelAnimationFrame(scrollAnimationRef.current);
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      
      if (isDraggingRef.current) {
        // Find cell and select
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const td = target?.closest('td');
        if (td) {
          const r = td.getAttribute('data-row');
          const c = td.getAttribute('data-col');
          if (r != null && c != null) {
            // We can dispatch a custom event or let standard React onMouseEnter handle it
            // but standard React might not fire if only scrolling happens. Let's just dispatch a MouseEvent
            // Actually, manual selection logic here is best:
            const rIndex = parseInt(r);
            const cIndex = parseInt(c);
            
            const start = dragStartRef.current;
            if (start && start.type === 'cell') {
              const minR = Math.min(start.r, rIndex);
              const maxR = Math.max(start.r, rIndex);
              const minC = Math.min(start.c, cIndex);
              const maxC = Math.max(start.c, cIndex);
              
              const newSet = new Set(dragSnapshotRef.current);
              for (let row = minR; row <= maxR; row++) {
                for (let col = minC; col <= maxC; col++) {
                  newSet.add(`${row},${col}`);
                }
              }
              setSelectedCells(newSet);
            }
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'z' || e.code === 'KeyZ')) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setHistory(prev => {
          if (prev.length > 0) {
            const previousState = prev[prev.length - 1];
            setActiveSheet(previousState);
            return prev.slice(0, -1);
          }
          return prev;
        });
      }
    };
    
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(scrollAnimationRef.current);
    };
  }, []);

  // Update isDragging reference when dragStart changes
  useEffect(() => {
    if (dragStart) {
      isDraggingRef.current = true;
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = requestAnimationFrame(autoScroll);
    } else {
      isDraggingRef.current = false;
      cancelAnimationFrame(scrollAnimationRef.current);
    }
  }, [dragStart]);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // For RTL, dragging left reduces clientX, which should increase width
      const diff = resizing.type === 'col' 
        ? resizing.startPos - e.clientX
        : e.clientY - resizing.startPos;

      const newSize = Math.max(resizing.type === 'col' ? 30 : 20, resizing.startSize + diff);
      
      setActiveSheet(prev => {
        if (!prev) return prev;
        if (resizing.type === 'col') {
          return { ...prev, colWidths: { ...(prev.colWidths || {}), [resizing.index]: newSize } };
        } else {
          return { ...prev, rowHeights: { ...(prev.rowHeights || {}), [resizing.index]: newSize } };
        }
      });
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const handleInsertShape = (shapeId: string) => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      if (shapeId === '') {
        const { shape, ...rest } = newColors[key] || {};
        newColors[key] = rest;
      } else {
        newColors[key] = { ...newColors[key], shape: shapeId };
      }
    });
    setActiveSheet({ ...activeSheet, colors: newColors });
    setShowShapesMenu(false);
  };

  const loadSheetData = async (title: string, sheetName: string) => {
    // التحقق مما إذا كان الشيت معدل مسبقاً ومحفوظ محلياً
    if (modifiedSheets[title]) {
      setHistory([]);
      setSelectedCells(new Set());
      setMenuRow(null);
      setMenuCol(null);
      setActiveSheet({ ...modifiedSheets[title] }); // استعادة النسخة المعدلة
      return;
    }

    try {
      setIsLoadingExcel(true);
      const response = await fetch('/دار القلم ١٤٤٧.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (!workbook.SheetNames.includes(sheetName)) {
        alert(`عذراً، الشيت "${sheetName}" غير موجود في الملف.`);
        setIsLoadingExcel(false);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false }) as any[][];
      
      let maxCols = 0;
      rawData.forEach(row => { if (row.length > maxCols) maxCols = row.length; });
      const normalizedData = rawData.map(row => {
        const newRow = [...row];
        while (newRow.length < maxCols) newRow.push("");
        return newRow;
      });

      const merges = worksheet['!merges'] || [];
      
      // تصفير جميع الحالات عند فتح شيت جديد
      setHistory([]);
      setSelectedCells(new Set());
      setMenuRow(null);
      setMenuCol(null);
      setActiveSheet({ title, data: normalizedData, merges, colors: {} });
    } catch (error) {
      console.error("Error loading Excel file:", error);
      alert("حدث خطأ أثناء قراءة ملف الإكسيل. تأكد من وجوده في المسار الصحيح.");
    } finally {
      setIsLoadingExcel(false);
    }
  };

  const deleteRow = (rIndex: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = [...activeSheet.data];
    newData.splice(rIndex, 1);
    
    const newMerges = activeSheet.merges.map(m => {
      let s = { ...m.s }; let e = { ...m.e };
      if (rIndex < s.r) s.r--;
      if (rIndex <= e.r && rIndex > s.r) e.r--;
      if (rIndex === e.r && s.r === e.r) return null; // حذف الدمج إذا تم حذف الصف بالكامل
      if (rIndex === s.r) { if (s.r === e.r) return null; e.r--; }
      return { s, e };
    }).filter(Boolean) as XLSX.Range[];
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setMenuRow(null);
  };

  const insertRow = (rIndex: number, offset: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = [...activeSheet.data];
    const newRow = new Array(newData[0]?.length || 1).fill("");
    newData.splice(rIndex + offset, 0, newRow);
    
    const newMerges = activeSheet.merges.map(m => {
      let s = { ...m.s }; let e = { ...m.e };
      if (s.r >= rIndex + offset) s.r++;
      if (e.r >= rIndex + offset) e.r++;
      return { s, e };
    });
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setMenuRow(null);
  };

  const deleteCol = (cIndex: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = activeSheet.data.map(row => {
      const newRow = [...row];
      newRow.splice(cIndex, 1);
      return newRow;
    });
    
    const newMerges = activeSheet.merges.map(m => {
      let s = { ...m.s }; let e = { ...m.e };
      if (cIndex < s.c) s.c--;
      if (cIndex <= e.c && cIndex > s.c) e.c--;
      if (cIndex === e.c && s.c === e.c) return null; 
      if (cIndex === s.c) { if (s.c === e.c) return null; e.c--; }
      return { s, e };
    }).filter(Boolean) as XLSX.Range[];
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setMenuCol(null);
  };

  const insertCol = (cIndex: number, offset: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = activeSheet.data.map(row => {
      const newRow = [...row];
      newRow.splice(cIndex + offset, 0, "");
      return newRow;
    });
    
    const newMerges = activeSheet.merges.map(m => {
      let s = { ...m.s }; let e = { ...m.e };
      if (s.c >= cIndex + offset) s.c++;
      if (e.c >= cIndex + offset) e.c++;
      return { s, e };
    });
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setMenuCol(null);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setActiveSheet(previousState);
      setHistory(prev => prev.slice(0, -1));
      // لا نحذف التحديد (selectedCells) ليبقى الشريط العائم ظاهراً
    }
  };

  const handleMouseDown = (rIndex: number, cIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setDragStart({ r: rIndex, c: cIndex, type: 'cell' });
    
    const cellKey = `${rIndex},${cIndex}`;
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cellKey)) newSet.delete(cellKey);
        else newSet.add(cellKey);
        setDragSnapshot(newSet);
        return newSet;
      });
    } else {
      setDragSnapshot(new Set());
      setSelectedCells(new Set([cellKey]));
    }
  };

  const handleMouseEnter = (rIndex: number, cIndex: number) => {
    if (dragStart && dragStart.type === 'cell') {
      const minR = Math.min(dragStart.r, rIndex);
      const maxR = Math.max(dragStart.r, rIndex);
      const minC = Math.min(dragStart.c, cIndex);
      const maxC = Math.max(dragStart.c, cIndex);
      
      const newSet = new Set(dragSnapshot);
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          newSet.add(`${r},${c}`);
        }
      }
      setSelectedCells(newSet);
    }
  };

  const handleColMouseDown = (cIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0 || !activeSheet) return;
    e.stopPropagation();
    setDragStart({ r: 0, c: cIndex, type: 'col' });
    
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        activeSheet.data.forEach((_, r) => newSet.add(`${r},${cIndex}`));
        setDragSnapshot(newSet);
        return newSet;
      });
    } else {
      const newSet = new Set<string>();
      activeSheet.data.forEach((_, r) => newSet.add(`${r},${cIndex}`));
      setDragSnapshot(new Set());
      setSelectedCells(newSet);
    }
  };

  const handleColMouseEnter = (cIndex: number) => {
    if (dragStart && dragStart.type === 'col' && activeSheet) {
      const minC = Math.min(dragStart.c, cIndex);
      const maxC = Math.max(dragStart.c, cIndex);
      const newSet = new Set(dragSnapshot);
      activeSheet.data.forEach((_, r) => {
        for (let c = minC; c <= maxC; c++) newSet.add(`${r},${c}`);
      });
      setSelectedCells(newSet);
    }
  };

  const handleRowMouseDown = (rIndex: number, e: React.MouseEvent) => {
    if (e.button !== 0 || !activeSheet) return;
    e.stopPropagation();
    setDragStart({ r: rIndex, c: 0, type: 'row' });
    
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedCells(prev => {
        const newSet = new Set(prev);
        activeSheet.data[rIndex].forEach((_, c) => newSet.add(`${rIndex},${c}`));
        setDragSnapshot(newSet);
        return newSet;
      });
    } else {
      const newSet = new Set<string>();
      activeSheet.data[rIndex].forEach((_, c) => newSet.add(`${rIndex},${c}`));
      setDragSnapshot(new Set());
      setSelectedCells(newSet);
    }
  };

  const handleRowMouseEnter = (rIndex: number) => {
    if (dragStart && dragStart.type === 'row' && activeSheet) {
      const minR = Math.min(dragStart.r, rIndex);
      const maxR = Math.max(dragStart.r, rIndex);
      const newSet = new Set(dragSnapshot);
      for (let r = minR; r <= maxR; r++) {
        activeSheet.data[r].forEach((_, c) => newSet.add(`${r},${c}`));
      }
      setSelectedCells(newSet);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSheet || selectedCells.size === 0) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setHistory(prev => [...prev, activeSheet]);
      const newColors = { ...activeSheet.colors };
      selectedCells.forEach(key => {
        newColors[key] = { ...newColors[key], image: base64 };
      });
      setActiveSheet({ ...activeSheet, colors: newColors });
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = '';
  };

  const clearSelectedContent = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = activeSheet.data.map(row => [...row]);
    selectedCells.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (newData[r] && newData[r][c] !== undefined) {
        newData[r][c] = "";
      }
    });
    setActiveSheet({ ...activeSheet, data: newData });
  };

  const deleteSelectedColsStructurally = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const colsToDelete = new Set<number>();
    selectedCells.forEach(key => colsToDelete.add(Number(key.split(',')[1])));
    const sortedCols = Array.from(colsToDelete).sort((a, b) => b - a);
    
    let newData = activeSheet.data.map(row => [...row]);
    let newMerges = [...activeSheet.merges];
    
    sortedCols.forEach(cIndex => {
       newData = newData.map(row => { row.splice(cIndex, 1); return row; });
       newMerges = newMerges.map(m => {
          let s = { ...m.s }; let e = { ...m.e };
          if (cIndex < s.c) s.c--;
          if (cIndex <= e.c && cIndex > s.c) e.c--;
          if (cIndex === e.c && s.c === e.c) return null; 
          if (cIndex === s.c) { if (s.c === e.c) return null; e.c--; }
          return { s, e };
        }).filter(Boolean) as XLSX.Range[];
    });
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setSelectedCells(new Set());
  };

  const deleteSelectedRowsStructurally = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const rowsToDelete = new Set<number>();
    selectedCells.forEach(key => rowsToDelete.add(Number(key.split(',')[0])));
    const sortedRows = Array.from(rowsToDelete).sort((a, b) => b - a);
    
    let newData = [...activeSheet.data];
    let newMerges = [...activeSheet.merges];
    
    sortedRows.forEach(rIndex => {
       newData.splice(rIndex, 1);
       newMerges = newMerges.map(m => {
          let s = { ...m.s }; let e = { ...m.e };
          if (rIndex < s.r) s.r--;
          if (rIndex <= e.r && rIndex > s.r) e.r--;
          if (rIndex === e.r && s.r === e.r) return null;
          if (rIndex === s.r) { if (s.r === e.r) return null; e.r--; }
          return { s, e };
        }).filter(Boolean) as XLSX.Range[];
    });
    
    setActiveSheet({ ...activeSheet, data: newData, merges: newMerges });
    setSelectedCells(new Set());
  };

  const handleBorder = (action: 'add' | 'remove') => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      newColors[key] = { ...newColors[key], border: action === 'add' ? '2px solid #1e293b' : undefined };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
    setShowBorderMenu(false);
  };

  const handleBold = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    let isBold = false;
    const firstKey = Array.from(selectedCells)[0] as string;
    if (newColors[firstKey]?.bold) isBold = true;

    selectedCells.forEach(key => {
      newColors[key] = { ...newColors[key], bold: !isBold };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
  };

  const handleFontSize = (delta: number) => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      const currentSize = newColors[key]?.fontSize || 16; // default 16px
      const newSize = Math.max(10, Math.min(72, currentSize + delta));
      newColors[key] = { ...newColors[key], fontSize: newSize };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      newColors[key] = { ...newColors[key], textAlign: align };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
  };

  const clearColContent = (cIndex: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = activeSheet.data.map(row => {
      const newRow = [...row];
      newRow[cIndex] = "";
      return newRow;
    });
    setActiveSheet({ ...activeSheet, data: newData });
    setMenuCol(null);
  };

  const clearRowContent = (rIndex: number) => {
    if (!activeSheet) return;
    setHistory(prev => [...prev, activeSheet]);
    const newData = [...activeSheet.data];
    newData[rIndex] = new Array(newData[rIndex].length).fill("");
    setActiveSheet({ ...activeSheet, data: newData });
    setMenuRow(null);
  };

  const selectFullCol = (cIndex: number) => {
    if (!activeSheet) return;
    const newSet = new Set(selectedCells);
    activeSheet.data.forEach((_, rIdx) => newSet.add(`${rIdx},${cIndex}`));
    setSelectedCells(newSet);
    setMenuCol(null);
  };

  const selectFullRow = (rIndex: number) => {
    if (!activeSheet) return;
    const newSet = new Set(selectedCells);
    activeSheet.data[rIndex].forEach((_, cIdx) => newSet.add(`${rIndex},${cIdx}`));
    setSelectedCells(newSet);
    setMenuRow(null);
  };

  const handleMerge = () => {
    if (!activeSheet || selectedCells.size < 2) return;
    setHistory(prev => [...prev, activeSheet]);

    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    selectedCells.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    });

    // إزالة الدمج القديم الذي يتقاطع مع الدمج الجديد
    const newMerges = activeSheet.merges.filter(m => {
      const intersect = !(m.e.r < minR || m.s.r > maxR || m.e.c < minC || m.s.c > maxC);
      return !intersect;
    });

    newMerges.push({ s: { r: minR, c: minC }, e: { r: maxR, c: maxC } });
    setActiveSheet({ ...activeSheet, merges: newMerges });
    setSelectedCells(new Set());
  };

  const handleUnmerge = () => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);

    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    selectedCells.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    });

    const newMerges = activeSheet.merges.filter(m => {
      const intersect = !(m.e.r < minR || m.s.r > maxR || m.e.c < minC || m.s.c > maxC);
      return !intersect;
    });

    setActiveSheet({ ...activeSheet, merges: newMerges });
  };

  const handleColor = (type: 'bg' | 'text', color: string) => {
    if (!activeSheet || selectedCells.size === 0) return;
    setHistory(prev => [...prev, activeSheet]);
    
    const newColors = { ...activeSheet.colors };
    selectedCells.forEach(key => {
      newColors[key] = { ...newColors[key], [type]: color };
    });
    
    setActiveSheet({ ...activeSheet, colors: newColors });
  };

  const handleSave = () => {
    setSavedData({
      complex: complexName,
      year: academicYear,
      path: pathName
    });
  };

  const handleSaveToOriginal = async () => {
    if (!activeSheet) return;
    try {
      // 1. Get original file
      const response = await fetch('/دار القلم ١٤٤٧.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const allCards = [
        { name: 'ادارة المجمع', sheetName: 'إدارة المجمع' },
        { name: 'بيانات المعلمين', sheetName: 'المعلمين' },
        { name: 'بيانات المعلمات', sheetName: 'المعلمات' },
        { name: 'بيانات الإداريين', sheetName: 'اداريين دار القلم' },
        { name: 'بيانات الإداريات', sheetName: 'اداريات دار القلم' },
        { name: 'الخدمات المساندة', sheetName: 'الخدمات المساندة' },
        { name: 'الوصف الوظيفي', sheetName: 'بيانات رواتب دار القلم' },
        { name: 'إحصاء الفصول والطلاب', sheetName: 'إحصاء الطلاب' },
        { name: 'إحصاء التخصصات', sheetName: 'إحصاء التخصصات' },
        { name: 'مساحات الفصول', sheetName: 'مساحات الفصول' },
        { name: 'الطاقة الاستيعابية', sheetName: 'الطاقة الاستيعابية' },
        { name: 'الإحصاء العام للمجمع', sheetName: 'الإحصاء العام للمجمع' },
        { name: 'مقارنة اعداد الطلاب', sheetName: 'مؤشرات المجمع' },
        { name: 'العهدة المالية', sheetName: 'العهدة المالية' },
        { name: 'المقاعد الشاغرة', sheetName: 'شواغر دار القلم' },
        { name: 'ترتيب القدرات والتحصيلي', sheetName: 'القدرات والتحصيلي' },
        { name: 'النشاط', sheetName: 'نشاط بنين ف٢' },
        { name: 'مقارنة النمو', sheetName: 'مقارنة النمو' },
        { name: 'STR / SAR / SSR / SER', sheetName: 'مؤشرات المجمع' },
        { name: 'اسناد بنين ف1', sheetName: 'اسناد بنين ف١' },
        { name: 'اسناد البنات ف1', sheetName: 'اسناد البنات ف١' }
      ];

      const originalSheetName = allCards.find(c => c.name === activeSheet.title)?.sheetName;
      if (originalSheetName && workbook.Sheets[originalSheetName]) {
        // Create new sheet from data
        const newWorksheet = XLSX.utils.aoa_to_sheet(activeSheet.data);
        newWorksheet['!merges'] = activeSheet.merges;
        
        // Retain col widths
        if (activeSheet.colWidths) {
          const maxCol = Math.max(...Object.keys(activeSheet.colWidths).map(Number));
          const cols = [];
          for(let i=0; i<=maxCol; i++) {
            cols.push(activeSheet.colWidths[i] ? { wpx: activeSheet.colWidths[i] } : { wpx: 80 });
          }
          newWorksheet['!cols'] = cols;
        }

        // Replace sheet in workbook
        workbook.Sheets[originalSheetName] = newWorksheet;
        
        // Write to array buffer
        const outBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        
        // Post to server to save directly
        const saveRes = await fetch('/api/save-excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: outBuffer
        });
        
        if (saveRes.ok) {
          alert('تم الحفظ في الملف الأصلي بنجاح!');
          // Update local state modified sheets as well just in case
          setModifiedSheets(prev => ({ ...prev, [activeSheet.title]: activeSheet }));
        } else {
          throw new Error('Server returned ' + saveRes.status);
        }
      } else {
        alert('لم يتم العثور على اسم الشيت الأصلي للحفظ!');
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ في الملف الأصلي.');
    }
  };

  const whiteCards = [
    { name: 'ادارة المجمع', sheetName: 'إدارة المجمع', icon: Building },
    { name: 'بيانات المعلمين', sheetName: 'المعلمين', icon: GraduationCap },
    { name: 'بيانات المعلمات', sheetName: 'المعلمات', icon: Users },
    { name: 'بيانات الإداريين', sheetName: 'اداريين دار القلم', icon: Briefcase },
    { name: 'بيانات الإداريات', sheetName: 'اداريات دار القلم', icon: UserCog },
    { name: 'الخدمات المساندة', sheetName: 'الخدمات المساندة', icon: HeartHandshake },
    { name: 'الوصف الوظيفي', sheetName: 'بيانات رواتب دار القلم', icon: FileText },
  ];

  const blueCards = [
    { name: 'إحصاء الفصول والطلاب', sheetName: 'إحصاء الطلاب', icon: BarChart },
    { name: 'إحصاء التخصصات', sheetName: 'إحصاء التخصصات', icon: PieChart },
    { name: 'مساحات الفصول', sheetName: 'مساحات الفصول', icon: Maximize },
    { name: 'الطاقة الاستيعابية', sheetName: 'الطاقة الاستيعابية', icon: BatteryCharging },
    { name: 'الإحصاء العام للمجمع', sheetName: 'الإحصاء العام للمجمع', icon: LineChart },
    { name: 'مقارنة اعداد الطلاب', sheetName: 'مؤشرات المجمع', icon: Users2 },
    { name: 'العهدة المالية', sheetName: 'العهدة المالية', icon: Wallet },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const getColLetter = (index: number) => {
    let letter = '';
    let temp = index;
    while (temp >= 0) {
      letter = String.fromCharCode(65 + (temp % 26)) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  const renderTable = () => {
    if (!activeSheet) return null;

    const skipMap = new Set<string>();
    const mergeMap = new Map<string, {rowSpan: number, colSpan: number}>();
    
    activeSheet.merges.forEach(m => {
      mergeMap.set(`${m.s.r},${m.s.c}`, {
        rowSpan: m.e.r - m.s.r + 1,
        colSpan: m.e.c - m.s.c + 1
      });
      for (let R = m.s.r; R <= m.e.r; ++R) {
        for (let C = m.s.c; C <= m.e.c; ++C) {
          if (R !== m.s.r || C !== m.s.c) {
            skipMap.add(`${R},${C}`);
          }
        }
      }
    });

    return (
      <div 
        ref={scrollContainerRef}
        className={`overflow-auto rounded-xl border border-slate-300 shadow-sm bg-white pb-4 custom-scrollbar ${isFullscreen ? 'flex-1 min-h-0 h-full' : 'max-h-[75vh]'}`}
        style={{ scrollBehavior: 'auto' }}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top right', minWidth: 'max-content' }}>
          <table className="text-sm text-center border-collapse w-max min-w-full" style={{ tableLayout: 'fixed' }}>
            <tbody>
              {/* صف أزرار التحكم بالأعمدة (رؤوس الأعمدة A, B, C...) */}
              <tr>
                <td className="p-2 border border-slate-300 bg-slate-200 w-16 min-w-[4rem] sticky top-0 right-0 z-30 shadow-[inset_-1px_-1px_0_#cbd5e1]"></td>
                {activeSheet.data[0]?.map((_, colIdx) => (
                  <td 
                    key={`del-c-${colIdx}`} 
                    onMouseDown={(e) => handleColMouseDown(colIdx, e)}
                    onMouseEnter={() => handleColMouseEnter(colIdx)}
                    style={{ width: activeSheet.colWidths?.[colIdx] ? `${activeSheet.colWidths[colIdx]}px` : undefined }}
                    className="p-2 border border-slate-300 bg-slate-200 text-center relative font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-300 transition-colors group sticky top-0 z-20 shadow-[inset_0_-1px_0_#cbd5e1]"
                  >
                  <div 
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (activeSheet) {
                        setHistory(prev => [...prev, activeSheet]);
                        const td = (e.target as HTMLElement).closest('td');
                        const startSize = activeSheet.colWidths?.[colIdx] || td?.offsetWidth || 100;
                        setResizing({ type: 'col', index: colIdx, startPos: e.clientX, startSize });
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (activeSheet) {
                        let maxW = 50;
                        activeSheet.data.forEach(row => {
                           const val = row[colIdx];
                           if (val) {
                             const len = String(val).length * 9 + 24;
                             if (len > maxW) maxW = len;
                           }
                        });
                        setHistory(prev => [...prev, activeSheet]);
                        setActiveSheet({
                          ...activeSheet,
                          colWidths: { ...(activeSheet.colWidths || {}), [colIdx]: Math.min(maxW, 600) }
                        });
                      }
                    }}
                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-all z-20"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span>{getColLetter(colIdx)}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMenuCol(menuCol === colIdx ? null : colIdx); setMenuRow(null); }}
                      className="text-slate-500 hover:text-blue-600 hover:bg-slate-400 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="خيارات العمود"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  {menuCol === colIdx && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg z-50 w-48 overflow-hidden flex flex-col">
                      <button 
                        onClick={() => selectFullCol(colIdx)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        تحديد كل خلايا العمود
                      </button>
                      <button 
                        onClick={() => insertCol(colIdx, 1)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        إدراج عمود لليسار
                      </button>
                      <button 
                        onClick={() => insertCol(colIdx, 0)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        إدراج عمود لليمين
                      </button>
                      <button 
                        onClick={() => clearColContent(colIdx)}
                        className="flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 text-right text-sm w-full font-bold border-b border-slate-100"
                      >
                        مسح المحتوى
                      </button>
                      <button 
                        onClick={() => deleteCol(colIdx)}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-right text-sm w-full font-bold"
                      >
                        حذف العمود
                      </button>
                    </div>
                  )}
                </td>
              ))}
            </tr>
            
            {activeSheet.data.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ height: activeSheet.rowHeights?.[rowIdx] ? `${activeSheet.rowHeights[rowIdx]}px` : undefined }} className={`border-b border-slate-200 transition-colors ${rowIdx === 0 ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-50 even:bg-slate-50'}`}>
                {/* زر تحكم الصف (أرقام الصفوف 1, 2, 3...) */}
                <td 
                  className="p-2 border border-slate-300 bg-slate-200 text-center w-16 min-w-[4rem] relative font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-300 transition-colors group sticky right-0 z-20 shadow-[inset_1px_0_0_#cbd5e1]"
                  onMouseDown={(e) => handleRowMouseDown(rowIdx, e)}
                  onMouseEnter={() => handleRowMouseEnter(rowIdx)}
                >
                  <div 
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (activeSheet) {
                        setHistory(prev => [...prev, activeSheet]);
                        const td = (e.target as HTMLElement).closest('td');
                        const startSize = activeSheet.rowHeights?.[rowIdx] || td?.offsetHeight || 30;
                        setResizing({ type: 'row', index: rowIdx, startPos: e.clientY, startSize });
                      }
                    }}
                    className="absolute left-0 right-0 bottom-0 h-1.5 cursor-row-resize hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-all z-20"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span>{rowIdx + 1}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMenuRow(menuRow === rowIdx ? null : rowIdx); setMenuCol(null); }}
                      className="text-slate-500 hover:text-blue-600 hover:bg-slate-400 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="خيارات الصف"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  {menuRow === rowIdx && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg z-50 w-48 overflow-hidden flex flex-col">
                      <button 
                        onClick={() => selectFullRow(rowIdx)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        تحديد كل خلايا الصف
                      </button>
                      <button 
                        onClick={() => insertRow(rowIdx, 0)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        إدراج صف لأعلى
                      </button>
                      <button 
                        onClick={() => insertRow(rowIdx, 1)}
                        className="px-3 py-2 text-slate-700 hover:bg-slate-100 text-right text-sm font-bold border-b border-slate-100"
                      >
                        إدراج صف لأسفل
                      </button>
                      <button 
                        onClick={() => clearRowContent(rowIdx)}
                        className="flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 text-right text-sm w-full font-bold border-b border-slate-100"
                      >
                        مسح المحتوى
                      </button>
                      <button 
                        onClick={() => deleteRow(rowIdx)}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 text-right text-sm w-full font-bold"
                      >
                        حذف الصف
                      </button>
                    </div>
                  )}
                </td>
                
                {row.map((cell, colIdx) => {
                  if (skipMap.has(`${rowIdx},${colIdx}`)) return null;
                  
                  const cellKey = `${rowIdx},${colIdx}`;
                  const isSelected = selectedCells.has(cellKey);
                  const cellColor = activeSheet.colors?.[cellKey] || {};
                  
                  const merge = mergeMap.get(cellKey);
                  const rowSpan = merge ? merge.rowSpan : 1;
                  const colSpan = merge ? merge.colSpan : 1;
                  
                  // تصميم الخلية يعتمد على التحديد واللون المخصص والصف الأول
                  let defaultClasses = "border border-slate-300 px-4 py-3 cursor-pointer select-none transition-all duration-200 relative ";
                  
                  // الحفاظ على الحجم والسمك الافتراضي سواء كان محدد أم لا
                  if (rowIdx === 0) {
                    defaultClasses += "text-lg font-bold ";
                  } else {
                    defaultClasses += "font-medium ";
                  }

                  if (isSelected) {
                    defaultClasses += "ring-2 ring-inset ring-blue-500 bg-blue-100 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)] text-slate-800 ";
                  } else if (rowIdx !== 0 && !cellColor.bg) {
                    defaultClasses += "text-slate-700 ";
                  }

                  return (
                    <td 
                      key={colIdx} 
                      data-row={rowIdx}
                      data-col={colIdx}
                      rowSpan={rowSpan} 
                      colSpan={colSpan}
                      onMouseDown={(e) => handleMouseDown(rowIdx, colIdx, e)}
                      onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                      style={{ 
                        backgroundColor: cellColor.bg || undefined,
                        color: cellColor.text || undefined,
                        border: cellColor.border || undefined,
                        fontWeight: cellColor.bold ? '900' : undefined,
                        fontSize: cellColor.fontSize ? `${cellColor.fontSize}px` : undefined,
                        textAlign: cellColor.textAlign || undefined,
                      }}
                      className={defaultClasses}
                    >
                      {/* Column resizer */}
                      <div 
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (activeSheet) {
                            setHistory(prev => [...prev, activeSheet]);
                            const td = (e.target as HTMLElement).closest('td');
                            const startSize = activeSheet.colWidths?.[colIdx] || td?.offsetWidth || 100;
                            setResizing({ type: 'col', index: colIdx, startPos: e.clientX, startSize });
                          }
                        }}
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100 transition-all z-10"
                      />
                      {/* Row resizer */}
                      <div 
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (activeSheet) {
                            setHistory(prev => [...prev, activeSheet]);
                            const td = (e.target as HTMLElement).closest('td');
                            const startSize = activeSheet.rowHeights?.[rowIdx] || td?.offsetHeight || 30;
                            setResizing({ type: 'row', index: rowIdx, startPos: e.clientY, startSize });
                          }
                        }}
                        className="absolute left-0 right-0 bottom-0 h-2 cursor-row-resize hover:bg-blue-500 opacity-0 hover:opacity-100 transition-all z-10"
                      />
                      {cellColor.image && (
                        <div className="w-full flex justify-center mb-1 pointer-events-none select-none">
                          <img src={cellColor.image} alt="شكل" className="max-h-16 object-contain rounded" />
                        </div>
                      )}
                      {cellColor.shape && (
                        <div className="w-full flex justify-center mb-1 pointer-events-none select-none" style={{ color: cellColor.text || '#334155' }}>
                          {cellColor.shape === 'circle' && <Circle size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'square' && <Square size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'triangle' && <Triangle size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'star' && <Star size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'arrow-right' && <ArrowRight size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'arrow-left' && <ArrowLeft size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'arrow-up' && <ArrowUp size={28} strokeWidth={2.5} />}
                          {cellColor.shape === 'arrow-down' && <ArrowDown size={28} strokeWidth={2.5} />}
                        </div>
                      )}
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
            {activeSheet.data.length === 0 && (
              <tr>
                <td colSpan={100} className="px-6 py-12 text-center text-slate-500 font-bold text-lg">
                  لا توجد بيانات متاحة في هذا الشيت أو تم حذفها بالكامل
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ username: data.username, role: data.role, complex: data.complex });
      } else {
        setLoginError(data.error || 'خطأ في تسجيل الدخول');
      }
    } catch (err) {
      setLoginError('تعذر الاتصال بالخادم');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldUsername: user?.username, 
          newUsername: editUsername, 
          newPassword: editPassword 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsMessage({ type: 'success', text: 'تم تحديث بياناتك بنجاح' });
        if (editUsername) {
          setUser({ ...user!, username: editUsername });
        }
        setEditUsername('');
        setEditPassword('');
      } else {
        setSettingsMessage({ type: 'error', text: data.error || 'حدث خطأ' });
      }
    } catch (err) {
      setSettingsMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: addUsername, 
          password: addPassword,
          role: 'user',
          complex: addComplex
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsMessage({ type: 'success', text: 'تم إضافة المستخدم بنجاح' });
        setAddUsername('');
        setAddPassword('');
        setAddComplex(COMPLEXES_LIST[0]);
        fetchUsers();
      } else {
        setSettingsMessage({ type: 'error', text: data.error || 'حدث خطأ' });
      }
    } catch (err) {
      setSettingsMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    if (showSettings && settingsTab === 'users' && user?.role === 'admin') {
      fetchUsers();
    }
  }, [showSettings, settingsTab, user]);

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟`)) return;
    try {
      const res = await fetch(`/api/users/${username}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (err) {
      alert('تعذر الاتصال بالخادم');
    }
  };

  const handleSaveEditUser = async (oldUsername: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldUsername, 
          newUsername: editUserForm.username, 
          newPassword: editUserForm.password,
          newComplex: editUserForm.complex
        })
      });
      if (res.ok) {
        setEditingUsername(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (err) {
      alert('تعذر الاتصال بالخادم');
    }
  };

  const togglePasswordVisibility = (username: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(username)) {
      newSet.delete(username);
    } else {
      newSet.add(username);
    }
    setVisiblePasswords(newSet);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans dir-rtl text-right" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl w-full max-w-md border border-slate-100 flex flex-col items-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
          
          <img src="/1000099843-removebg-preview.png" alt="التنمية المتكاملة" className="h-32 object-contain mb-8 drop-shadow-sm" />
          <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">تسجيل الدخول للنظام</h1>
          
          {loginError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl w-full mb-6 text-sm border border-red-100 font-medium text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
                <UserSquare2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input 
                  type={showLoginPassword ? "text" : "password"} 
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800 font-medium"
                  placeholder="أدخل كلمة المرور"
                  required
                />
                <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <button 
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? 'جاري التحقق...' : (
                <>
                  دخول للنظام
                  <ArrowLeft size={20} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50/50 text-slate-800 font-sans p-3 sm:p-6 md:p-12" dir="rtl">
      {/* لوحة الإعدادات */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserCog size={20} className="text-blue-600" />
                إعدادات النظام
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex border-b">
              <button 
                onClick={() => setSettingsTab('profile')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${settingsTab === 'profile' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                تغيير بياناتي
              </button>
              {user.role === 'admin' && (
                <button 
                  onClick={() => setSettingsTab('users')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${settingsTab === 'users' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                >
                  إضافة مستخدم جديد
                </button>
              )}
            </div>

            <div className="p-6">
              {settingsMessage.text && (
                <div className={`p-3 rounded-lg mb-4 text-sm font-bold text-center ${settingsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {settingsMessage.text}
                </div>
              )}

              {settingsTab === 'profile' && (
                <form onSubmit={handleChangeCredentials} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم الجديد</label>
                    <input 
                      type="text" 
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                      placeholder="اتركه فارغاً إذا لم ترغب بتغييره"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                      placeholder="اتركه فارغاً إذا لم ترغب بتغييرها"
                    />
                  </div>
                  <button type="submit" className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98]">
                    حفظ التعديلات
                  </button>
                </form>
              )}

              {settingsTab === 'users' && user.role === 'admin' && (
                <div className="flex flex-col gap-6">
                  <form onSubmit={handleAddUser} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم</label>
                      <input 
                        type="text" 
                        value={addUsername}
                        onChange={e => setAddUsername(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                        placeholder="أدخل اسم المستخدم"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
                      <input 
                        type="password" 
                        value={addPassword}
                        onChange={e => setAddPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                        placeholder="أدخل كلمة المرور"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">المجمع التابع له</label>
                      <select 
                        value={addComplex}
                        onChange={e => setAddComplex(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-800"
                      >
                        {COMPLEXES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.98]">
                      إضافة المستخدم
                    </button>
                  </form>

                  <hr className="border-slate-200" />

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Users size={18} className="text-blue-600" />
                      قائمة المستخدمين
                    </h3>
                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
                      {allUsers.map(u => (
                        <div key={u.username} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          {editingUsername === u.username ? (
                            <div className="flex-1 flex gap-2">
                              <input 
                                value={editUserForm.username} 
                                onChange={e => setEditUserForm({ ...editUserForm, username: e.target.value })} 
                                className="flex-1 p-2 rounded-lg border border-slate-300 text-sm" 
                                placeholder="الاسم" 
                              />
                              <input 
                                value={editUserForm.password} 
                                onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })} 
                                className="flex-1 p-2 rounded-lg border border-slate-300 text-sm" 
                                placeholder="كلمة المرور" 
                              />
                              <select
                                value={editUserForm.complex}
                                onChange={e => setEditUserForm({ ...editUserForm, complex: e.target.value })}
                                className="flex-1 p-2 rounded-lg border border-slate-300 text-sm"
                              >
                                {COMPLEXES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                              <button onClick={() => handleSaveEditUser(u.username)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200">
                                <Check size={16}/>
                              </button>
                              <button onClick={() => setEditingUsername(null)} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">
                                <X size={16}/>
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-between">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700">{u.username}</span>
                                  {u.role === 'admin' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">أدمن</span>}
                                  {u.complex && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{u.complex}</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-600 tracking-wider">
                                    {visiblePasswords.has(u.username) ? u.password : '••••••••'}
                                  </span>
                                  <button onClick={() => togglePasswordVisibility(u.username)} className="text-slate-400 hover:text-slate-600">
                                    {visiblePasswords.has(u.username) ? <EyeOff size={14}/> : <Eye size={14}/>}
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => { 
                                    setEditingUsername(u.username); 
                                    setEditUserForm({username: u.username, password: u.password, complex: u.complex || COMPLEXES_LIST[0]}); 
                                  }} 
                                  className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="تعديل"
                                >
                                  <Edit2 size={16}/>
                                </button>
                                {u.username !== user.username && (
                                  <button 
                                    onClick={() => handleDeleteUser(u.username)} 
                                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                    title="حذف"
                                  >
                                    <Trash2 size={16}/>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {allUsers.length === 0 && (
                        <div className="text-center text-slate-500 py-4 text-sm font-medium">
                          لا يوجد مستخدمين آخرين
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 flex-1 w-full flex flex-col">
        
        {/* الترويسة والشعارات */}
        <header className="relative w-full flex flex-col gap-4 md:gap-6">
          <div className="w-full flex justify-end">
            <button 
              onClick={() => setShowSettings(true)}
              className="bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all font-bold text-sm"
            >
              <UserCog size={18} />
              الإعدادات
            </button>
            <button 
              onClick={() => setUser(null)}
              className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all font-bold text-sm mr-2"
            >
              تسجيل الخروج
            </button>
          </div>
          <div className="bg-white border-2 border-blue-500 rounded-2xl md:rounded-3xl px-2 sm:px-6 md:px-10 py-2 shadow-md shadow-blue-900/5 w-full flex flex-row justify-center items-center overflow-hidden relative">
            <div className="flex justify-center items-center min-w-0">
              {user.role === 'admin' ? (
                <img src="/1000099843-removebg-preview.png" alt="التنمية المتكاملة" className="h-16 sm:h-24 md:h-36 lg:h-48 xl:h-[22rem] w-auto object-contain flex-shrink-0 -my-2 sm:-my-4 md:-my-6" />
              ) : (
                <img src={COMPLEX_LOGOS[user.complex || ''] || '/1000099845-removebg-preview.png'} alt={user.complex} className="h-16 sm:h-24 md:h-36 lg:h-48 xl:h-[22rem] w-auto object-contain flex-shrink-0 -my-2 sm:-my-4 md:-my-6" />
              )}
            </div>
            
            {/* Read-Only Badge */}
            {user.role === 'admin' && (
              <div className="absolute top-4 right-4 bg-orange-100 border border-orange-300 text-orange-800 px-2 sm:px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-2 text-xs sm:text-sm">
                <Eye size={16} />
                <span>تقارير فقط</span>
              </div>
            )}
          </div>
        </header>

        {/* مساحة العمل */}
        <main className="flex-1 flex flex-col w-full space-y-8">
          
          {/* لوحة الاختيارات (الفلاتر) */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col md:flex-row items-end gap-4 w-full">
            
            {/* العام الدراسي */}
            <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                <Calendar size={16} className="text-blue-500" />
                العام الدراسي
              </label>
              <select 
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer text-slate-700"
              >
                <option value="2026/2027">2026/2027</option>
                <option value="2027/2028">2027/2028</option>
                <option value="2028/2029">2028/2029</option>
                <option value="2029/2030">2029/2030</option>
              </select>
            </div>

            {/* المسار */}
            <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                <GraduationCap size={16} className="text-blue-500" />
                المسار
              </label>
              <select 
                value={pathName}
                onChange={(e) => setPathName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer text-slate-700"
              >
                <option value="أهلي">أهلي</option>
                <option value="دولي">دولي</option>
                <option value="دبلومة أمريكية">دبلومة أمريكية</option>
                <option value="نون">نون</option>
                <option value="مصري">مصري</option>
                <option value="تربية خاصة">تربية خاصة</option>
                <option value="فرنسي">فرنسي</option>
              </select>
            </div>

            {/* اختيار اسم المجمع */}
            <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                <Building2 size={16} className="text-blue-500" />
                اختيار اسم المجمع
              </label>
              <select 
                value={complexName}
                onChange={(e) => setComplexName(e.target.value)}
                disabled={user.role !== 'admin'}
                className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700 ${user.role !== 'admin' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {user.role === 'admin' && <option value="كل المجمعات">كل المجمعات</option>}
                {COMPLEXES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* بيانات (حالة العمل) */}
            <div className="flex-1 w-full">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-900 mb-2">
                <UserSquare2 size={16} className="text-blue-500" />
                بيانات
              </label>
              <select 
                value={dataStatus}
                onChange={(e) => setDataStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer text-slate-700"
              >
                <option value="الكل">الكل</option>
                <option value="على رأس العمل">على رأس العمل</option>
                <option value="ترك العمل">ترك العمل</option>
              </select>
            </div>

            {/* زر الحفظ */}
            <div className="w-full md:w-auto flex flex-col gap-2">
              <button 
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                OK
              </button>
              {Object.keys(modifiedSheets).length > 0 && (
                <button 
                  onClick={async () => {
                    try {
                      // جلب الملف الأصلي
                      const response = await fetch('/دار القلم ١٤٤٧.xlsx');
                      const arrayBuffer = await response.arrayBuffer();
                      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                      
                      // استبدال الشيتات المعدلة في الملف الأصلي
                      Object.entries(modifiedSheets).forEach(([title, sheetData]: [string, any]) => {
                        // تحديد اسم الشيت الأصلي
                        const allCards = [...whiteCards, ...blueCards, 
                          { name: 'المقاعد الشاغرة', sheetName: 'شواغر دار القلم' },
                          { name: 'ترتيب القدرات والتحصيلي', sheetName: 'القدرات والتحصيلي' },
                          { name: 'النشاط', sheetName: 'نشاط بنين ف٢' },
                          { name: 'بيانات المرافق', sheetName: 'مساحات الفصول' },
                          { name: 'مقارنة النمو', sheetName: 'مقارنة النمو' },
                          { name: 'STR / SAR / SSR / SER', sheetName: 'مؤشرات المجمع' },
                          { name: 'اسناد بنين ف1', sheetName: 'اسناد بنين ف١' },
                          { name: 'اسناد البنات ف1', sheetName: 'اسناد البنات ف١' },
                        ];
                        
                        const originalSheetName = allCards.find(c => c.name === title)?.sheetName;
                        if (originalSheetName && workbook.Sheets[originalSheetName]) {
                          // إنشاء شيت جديد بناءً على الداتا المعدلة
                          const newWorksheet = XLSX.utils.aoa_to_sheet(sheetData.data);
                          // استرجاع الدمج
                          newWorksheet['!merges'] = sheetData.merges;
                          // استبدال الشيت في الملف
                          workbook.Sheets[originalSheetName] = newWorksheet;
                        }
                      });
                      
                      // تصدير وتنزيل الملف الجديد
                      XLSX.writeFile(workbook, 'دار القلم ١٤٤٧.xlsx');
                      alert("تم تصدير ملف الإكسيل بنجاح!");
                    } catch (error) {
                      console.error("Export error:", error);
                      alert("حدث خطأ أثناء التصدير.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Save size={18} />
                  تصدير إكسيل
                </button>
              )}
            </div>

          </div>

          {/* منطقة العرض بعد الحفظ (اللوحة الرئيسية) */}
          {savedData && !activeSheet && (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col w-full mt-4 pb-12"
            >
              
              {/* البيانات المختارة (فوق البطاقات) */}
              <motion.div variants={itemVariants} className="w-full flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-blue-100 p-8 mb-8">
                {savedData.complex === 'كل المجمعات' ? (
                  <img 
                    src="/1000099843-removebg-preview.png" 
                    alt="التنمية المتكاملة" 
                    className="h-28 md:h-44 w-auto object-contain mb-6 drop-shadow-sm" 
                  />
                ) : (
                  <img 
                    src={COMPLEX_LOGOS[savedData.complex] || '/1000099845-removebg-preview.png'} 
                    alt={savedData.complex} 
                    className="h-28 md:h-44 w-auto object-contain mb-6 drop-shadow-sm" 
                  />
                )}
                <h2 className="text-3xl md:text-5xl font-extrabold text-blue-950 mb-4 text-center">
                  {savedData.complex}
                </h2>
                <div className="flex flex-wrap gap-4 items-center justify-center">
                  <div className="inline-flex items-center justify-center bg-blue-100 text-blue-800 px-6 py-2 rounded-full text-lg md:text-xl font-bold shadow-sm border border-blue-200">
                    العام الدراسي: {savedData.year}
                  </div>
                  <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 px-6 py-2 rounded-full text-lg md:text-xl font-bold shadow-sm border border-emerald-200">
                    المسار: {savedData.path}
                  </div>
                </div>
              </motion.div>

              {/* شرط عرض البيانات */}
              {savedData.complex === 'دار القلم' && savedData.year === '2026/2027' ? (
                <>
                  {/* المربع الجديد: STR/SAR/SSR/SER */}
                  <div className="w-full flex justify-center mb-6">
                    <motion.button 
                      onClick={() => loadSheetData('STR / SAR / SSR / SER', 'مؤشرات المجمع')}
                      variants={itemVariants} 
                      className="w-full max-w-2xl bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 group"
                    >
                      <Activity size={40} className="group-hover:scale-110 transition-transform" />
                      <span className="text-2xl md:text-3xl font-extrabold tracking-wider">STR / SAR / SSR / SER</span>
                    </motion.button>
                  </div>

                  {/* مربعين إسناد بنين وبنات */}
                  <div className="w-full flex flex-row justify-center gap-4 md:gap-6 mb-12 max-w-3xl mx-auto">
                    <motion.button 
                      onClick={() => loadSheetData('اسناد بنين ف1', 'اسناد بنين ف١')}
                      variants={itemVariants} 
                      className="flex-1 bg-cyan-700 hover:bg-cyan-800 text-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 group"
                    >
                      <Users size={36} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xl md:text-2xl font-bold">اسناد بنين ف1</span>
                    </motion.button>
                    <motion.button 
                      onClick={() => loadSheetData('اسناد البنات ف1', 'اسناد البنات ف١')}
                      variants={itemVariants} 
                      className="flex-1 bg-cyan-700 hover:bg-cyan-800 text-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 group"
                    >
                      <Users size={36} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xl md:text-2xl font-bold">اسناد البنات ف1</span>
                    </motion.button>
                  </div>

                  {/* أزرار اختيار الفئة (بيانات أو تقارير) */}
                  <div className="flex flex-row justify-center gap-4 md:gap-6 mb-8 w-full max-w-2xl mx-auto">
                    <button
                      onClick={() => setSelectedCategory('بيانات')}
                      className={`flex-1 py-4 md:py-6 rounded-2xl font-bold text-xl md:text-2xl shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                        selectedCategory === 'بيانات'
                          ? 'bg-blue-600 text-white border-2 border-blue-700 scale-105 shadow-lg'
                          : 'bg-white text-blue-700 border-2 border-slate-200 hover:bg-blue-50 hover:-translate-y-1'
                      }`}
                    >
                      <LayoutGrid size={36} className={selectedCategory === 'بيانات' ? 'animate-bounce' : ''} />
                      بيانات
                    </button>
                    <button
                      onClick={() => setSelectedCategory('تقارير')}
                      className={`flex-1 py-4 md:py-6 rounded-2xl font-bold text-xl md:text-2xl shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                        selectedCategory === 'تقارير'
                          ? 'bg-blue-600 text-white border-2 border-blue-700 scale-105 shadow-lg'
                          : 'bg-white text-blue-700 border-2 border-slate-200 hover:bg-blue-50 hover:-translate-y-1'
                      }`}
                    >
                      <PieChart size={36} className={selectedCategory === 'تقارير' ? 'animate-bounce' : ''} />
                      تقارير
                    </button>
                  </div>

                  {/* القوائم المربعة - أفقية (البيضاء فوق والزرقاء تحت) */}
                  <div className="flex flex-col gap-6 md:gap-8 w-full mb-12">
                    
                    {/* صف البطاقات البيضاء */}
                    {selectedCategory === 'بيانات' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 lg:gap-5 w-full"
                      >
                        {whiteCards.map((card, idx) => (
                          <motion.button 
                            onClick={() => loadSheetData(card.name, card.sheetName)}
                            variants={itemVariants}
                            key={idx}
                            className="flex flex-col items-center justify-center gap-2 lg:gap-3 p-2 lg:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 group aspect-square text-center w-full"
                          >
                            <div className="p-2 lg:p-3 bg-blue-50 text-blue-600 rounded-xl lg:rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                              <card.icon className="w-7 h-7 lg:w-9 lg:h-9 opacity-90" />
                            </div>
                            <span className="text-xs lg:text-sm font-bold text-slate-700 leading-snug group-hover:text-blue-700 px-1">
                              {card.name}
                            </span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}

                    {/* صف البطاقات الزرقاء */}
                    {selectedCategory === 'تقارير' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 lg:gap-5 w-full"
                      >
                        {blueCards.map((card, idx) => (
                          <motion.button 
                            onClick={() => loadSheetData(card.name, card.sheetName)}
                            variants={itemVariants}
                            key={idx}
                            className="flex flex-col items-center justify-center gap-2 lg:gap-3 p-2 lg:p-4 bg-blue-600 rounded-2xl border border-blue-700 shadow-sm hover:shadow-md hover:bg-blue-700 hover:border-blue-800 hover:-translate-y-1 transition-all duration-300 group aspect-square text-center w-full"
                          >
                            <div className="p-2 lg:p-3 bg-blue-500/50 text-white rounded-xl lg:rounded-2xl group-hover:bg-white group-hover:text-blue-700 transition-colors duration-300">
                              <card.icon className="w-7 h-7 lg:w-9 lg:h-9 opacity-100" />
                            </div>
                            <span className="text-xs lg:text-sm font-bold text-white leading-snug px-1">
                              {card.name}
                            </span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* المربعات الأربعة السفلية */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto mt-4">
                    {/* المجموعة الأولى (برتقالي) */}
                    <motion.button 
                      onClick={() => loadSheetData('المقاعد الشاغرة', 'شواغر دار القلم')}
                      variants={itemVariants} 
                      className="bg-orange-500 hover:bg-orange-600 text-white p-6 md:p-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
                    >
                      <LayoutGrid size={40} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xl font-bold">المقاعد الشاغرة</span>
                    </motion.button>
                    <motion.button 
                      onClick={() => loadSheetData('ترتيب القدرات والتحصيلي', 'القدرات والتحصيلي')}
                      variants={itemVariants} 
                      className="bg-orange-500 hover:bg-orange-600 text-white p-6 md:p-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
                    >
                      <TrendingUp size={40} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xl font-bold text-center leading-tight">ترتيب القدرات والتحصيلي</span>
                    </motion.button>

                    {/* المجموعة الثانية (أخضر زمردي) */}
                    <motion.button 
                      onClick={() => loadSheetData('النشاط', 'نشاط بنين ف٢')}
                      variants={itemVariants} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 md:p-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
                    >
                      <Gamepad2 size={40} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xl font-bold">النشاط</span>
                    </motion.button>
                    <motion.button 
                      onClick={() => loadSheetData('بيانات المرافق', 'مساحات الفصول')}
                      variants={itemVariants} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 md:p-8 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-4 group"
                    >
                      <Building2 size={40} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xl font-bold">بيانات المرافق</span>
                    </motion.button>
                  </div>

                  {/* المربع الجديد: مقارنة النمو (أصفر) */}
                  <div className="w-full flex justify-center mt-8">
                    <motion.button 
                      onClick={() => loadSheetData('مقارنة النمو', 'مقارنة النمو')}
                      variants={itemVariants} 
                      className="w-full max-w-2xl bg-amber-500 hover:bg-amber-600 text-white rounded-2xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 group"
                    >
                      <LineChart size={40} className="group-hover:scale-110 transition-transform" />
                      <span className="text-2xl md:text-3xl font-extrabold tracking-wider">مقارنة النمو</span>
                    </motion.button>
                  </div>
                </>
              ) : (
                <motion.div variants={itemVariants} className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <LayoutGrid size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">لا توجد بيانات متاحة</h3>
                  <p className="text-slate-500 text-lg">
                    عذراً، البيانات المتوفرة حالياً مخصصة فقط لـ <strong>مجمع دار القلم</strong> للعام الدراسي <strong>2026/2027</strong>.
                  </p>
                </motion.div>
              )}

            </motion.div>
          )}

          {/* منطقة عرض جدول الإكسيل */}
          {activeSheet && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full bg-white shadow-sm border border-blue-100 p-4 md:p-8 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-hidden h-screen m-0' : 'rounded-2xl mt-4'}`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-blue-50 pb-4 shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-blue-950 flex items-center gap-3">
                    <FileText className="text-blue-500" size={32} />
                    {activeSheet.title}
                  </h2>
                  {history.length > 0 && (
                    <button 
                      onClick={handleUndo}
                      className="flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all"
                      title="تراجع عن آخر تعديل"
                    >
                      <Undo2 size={16} />
                      تراجع
                    </button>
                  )}
                  
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-4 border border-slate-200">
                    <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 2))} className="p-1.5 hover:bg-white rounded text-slate-700 transition-colors shadow-sm" title="تكبير العرض">
                      <ZoomIn size={16} />
                    </button>
                    <span className="text-slate-700 text-sm font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.4))} className="p-1.5 hover:bg-white rounded text-slate-700 transition-colors shadow-sm" title="تصغير العرض">
                      <ZoomOut size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-white rounded text-slate-700 transition-colors shadow-sm" title={isFullscreen ? "تصغير النافذة" : "ملء الشاشة"}>
                      <Maximize size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {user.role !== 'admin' && (
                    <button 
                      onClick={handleSaveToOriginal}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      <Save size={18} />
                      حفظ التعديلات في الملف
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveSheet(null)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                  >
                    رجوع للوحة التحكم
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>

              {/* شريط الأدوات (يظهر عند تحديد خلايا) */}
              {selectedCells.size > 0 && user.role !== 'admin' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-slate-800 text-white rounded-xl ${isToolbarCollapsed ? 'p-2 w-max' : 'px-4 py-3'} mb-6 flex flex-wrap items-center gap-4 shadow-md sticky top-4 z-20 border border-slate-700`}
                >
                  {isToolbarCollapsed ? (
                    <button 
                      onClick={() => setIsToolbarCollapsed(false)} 
                      className="hover:bg-slate-700 p-1 rounded transition-colors text-slate-200 flex items-center justify-center" 
                      title="إظهار شريط الأدوات"
                    >
                      <ChevronDown size={20} />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsToolbarCollapsed(true)} 
                        className="hover:bg-slate-700 p-1 rounded transition-colors text-slate-200 flex items-center justify-center border-l border-slate-600 pl-3" 
                        title="طي شريط الأدوات"
                      >
                        <ChevronUp size={20} />
                      </button>
                      <div className="flex items-center gap-2 border-l border-slate-600 pl-4">
                        <span className="text-sm font-bold bg-slate-700 px-2 py-1 rounded-md text-blue-200">{selectedCells.size}</span>
                        <span className="text-sm font-medium">خلايا محددة</span>
                        <button 
                          onClick={() => setSelectedCells(new Set())}
                          className="ml-2 hover:bg-slate-700 p-1 rounded transition-colors"
                          title="إلغاء التحديد"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 border-l border-slate-600 pl-4">
                        <button 
                          onClick={handleUndo}
                          disabled={history.length === 0}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold ${history.length === 0 ? 'text-slate-500 cursor-not-allowed' : 'hover:bg-slate-700 text-white'}`}
                          title="تراجع"
                        >
                          <Undo2 size={16} />
                          تراجع
                        </button>
                    
                    <div className="relative flex items-center border-menu-container">
                      <button 
                        onClick={() => setShowBorderMenu(!showBorderMenu)}
                        className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-slate-200"
                        title="حدود الخلايا"
                      >
                        <LayoutGrid size={16} />
                        حدود
                      </button>
                      {showBorderMenu && (
                        <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-600 rounded-lg p-2 flex flex-col gap-1 shadow-xl z-50 w-36">
                          <button onClick={() => handleBorder('add')} className="px-3 py-2 text-right hover:bg-slate-700 rounded text-slate-200 text-sm font-bold">إضافة حدود</button>
                          <button onClick={() => handleBorder('remove')} className="px-3 py-2 text-right hover:bg-slate-700 rounded text-red-400 text-sm font-bold">إزالة الحدود</button>
                        </div>
                      )}
                    </div>

                    {/* أزرار التنسيق */}
                    <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
                      {(() => {
                        let isSelectionBold = false;
                        if (selectedCells.size > 0 && activeSheet) {
                          const firstKey = Array.from(selectedCells)[0] as string;
                          isSelectionBold = !!activeSheet.colors?.[firstKey]?.bold;
                        }
                        return (
                          <button onClick={handleBold} className={`p-1.5 rounded transition-colors ${isSelectionBold ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-slate-600 text-slate-200'}`} title="عريض (Bold)">
                            <Bold size={16} />
                          </button>
                        );
                      })()}
                      <div className="w-px h-4 bg-slate-600 mx-1"></div>
                      <button onClick={() => handleFontSize(2)} className="p-1.5 hover:bg-slate-600 rounded text-slate-200 flex items-center gap-0.5" title="تكبير الخط">
                        <Type size={16} /><Plus size={12} />
                      </button>
                      <button onClick={() => handleFontSize(-2)} className="p-1.5 hover:bg-slate-600 rounded text-slate-200 flex items-center gap-0.5" title="تصغير الخط">
                        <Type size={16} /><Minus size={12} />
                      </button>
                      <div className="w-px h-4 bg-slate-600 mx-1"></div>
                      <button onClick={() => handleAlign('right')} className="p-1.5 hover:bg-slate-600 rounded text-slate-200" title="محاذاة لليمين">
                        <AlignRight size={16} />
                      </button>
                      <button onClick={() => handleAlign('center')} className="p-1.5 hover:bg-slate-600 rounded text-slate-200" title="محاذاة للوسط">
                        <AlignCenter size={16} />
                      </button>
                      <button onClick={() => handleAlign('left')} className="p-1.5 hover:bg-slate-600 rounded text-slate-200" title="محاذاة لليسار">
                        <AlignLeft size={16} />
                      </button>
                    </div>

                    <button 
                      onClick={clearSelectedContent}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-amber-400"
                      title="مسح المحتوى"
                    >
                      <Eraser size={16} />
                      مسح
                    </button>
                    <label 
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-green-400 cursor-pointer"
                      title="إضافة صورة أو شكل"
                    >
                      <ImageIcon size={16} />
                      صورة
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <div className="relative flex items-center shapes-menu-container">
                      <button 
                        onClick={() => setShowShapesMenu(!showShapesMenu)}
                        className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-pink-400"
                        title="إضافة شكل هندسي"
                      >
                        <Shapes size={16} />
                        أشكال
                      </button>
                      {showShapesMenu && (
                        <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-600 rounded-lg p-2 flex gap-1.5 shadow-xl z-50">
                          <button onClick={() => handleInsertShape('circle')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="دائرة"><Circle size={20} /></button>
                          <button onClick={() => handleInsertShape('square')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="مربع"><Square size={20} /></button>
                          <button onClick={() => handleInsertShape('triangle')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="مثلث"><Triangle size={20} /></button>
                          <button onClick={() => handleInsertShape('star')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="نجمة"><Star size={20} /></button>
                          <button onClick={() => handleInsertShape('arrow-up')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="سهم لأعلى"><ArrowUp size={20} /></button>
                          <button onClick={() => handleInsertShape('arrow-down')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="سهم لأسفل"><ArrowDown size={20} /></button>
                          <button onClick={() => handleInsertShape('arrow-right')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="سهم لليمين"><ArrowRight size={20} /></button>
                          <button onClick={() => handleInsertShape('arrow-left')} className="p-1.5 hover:bg-slate-700 rounded text-slate-200" title="سهم لليسار"><ArrowLeft size={20} /></button>
                          <div className="w-px h-6 bg-slate-600 mx-1 self-center"></div>
                          <button onClick={() => handleInsertShape('')} className="p-1.5 hover:bg-slate-700 rounded text-red-400" title="إزالة الشكل"><Eraser size={20} /></button>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={deleteSelectedColsStructurally}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-red-400"
                      title="حذف الأعمدة المحددة بالكامل"
                    >
                      <Columns size={16} />
                      حذف أعمدة
                    </button>
                    <button 
                      onClick={deleteSelectedRowsStructurally}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold text-red-400"
                      title="حذف الصفوف المحددة بالكامل"
                    >
                      <Rows size={16} />
                      حذف صفوف
                    </button>
                    <button 
                      onClick={handleMerge}
                      disabled={selectedCells.size < 2}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                    >
                      <Combine size={16} />
                      دمج
                    </button>
                    <button 
                      onClick={handleUnmerge}
                      disabled={selectedCells.size === 0}
                      className="flex items-center gap-1.5 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                      title="فك الدمج"
                    >
                      <Split size={16} />
                      فك الدمج
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-300">
                        <PaintBucket size={14} /> لون الخلفية
                      </div>
                      <div className="flex gap-1 flex-wrap max-w-[280px] max-h-16 overflow-y-auto custom-scrollbar p-1">
                        {PALETTE.map(c => (
                          <button 
                            key={`bg-${c}`} 
                            onClick={() => handleColor('bg', c)} 
                            className="w-5 h-5 rounded border border-slate-600 hover:scale-110 transition-transform shrink-0" 
                            style={{backgroundColor: c}}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 border-r border-slate-600 pr-4">
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-300">
                        <Type size={14} /> لون النص
                      </div>
                      <div className="flex gap-1 flex-wrap max-w-[280px] max-h-16 overflow-y-auto custom-scrollbar p-1">
                        {PALETTE.map(c => (
                          <button 
                            key={`text-${c}`} 
                            onClick={() => handleColor('text', c)} 
                            className="w-5 h-5 rounded border border-slate-600 hover:scale-110 transition-transform shrink-0" 
                            style={{backgroundColor: c}}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  </>
                  )}
                </motion.div>
              )}
              
              {renderTable()}
            </motion.div>
          )}

        </main>

      </div>

      {/* التذييل */}
      <footer className="mt-12 text-center text-slate-500 text-sm space-y-1 pb-4">
        <p>برمجة وتطوير محمود مصري - أخصائي تكنولوجيا التعليم بمدارس دار القلم</p>
        <p dir="ltr">Created by Mahmoud Masry - Educational Technology Specialist at Dar Al-Qalam Schools</p>
      </footer>
    </div>
  );
}

export default App;
