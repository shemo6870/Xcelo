import { db } from './firebase';
export { db };
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc, setDoc } from 'firebase/firestore';

const usersCol = collection(db, 'users');

export const getUsers = async () => {
  const snapshot = await getDocs(usersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const loginUser = async (username: string, password: string): Promise<any> => {
  const q = query(usersCol, where("username", "==", username), where("password", "==", password));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const user = snapshot.docs[0].data();
    return { success: true, ...user };
  }
  return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
};

export const addUser = async (username: string, password: string, role: string, complex: string): Promise<any> => {
  const q = query(usersCol, where("username", "==", username));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return { success: false, error: 'اسم المستخدم موجود بالفعل' };
  }
  await addDoc(usersCol, { username, password, role: role || 'user', complex: complex || 'كل المجمعات' });
  return { success: true, message: 'تم إضافة المستخدم بنجاح' };
};

export const updateUser = async (oldUsername: string, newUsername?: string, newPassword?: string, newComplex?: string): Promise<any> => {
  const q = query(usersCol, where("username", "==", oldUsername));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return { success: false, error: 'المستخدم غير موجود' };
  }
  
  if (newUsername && newUsername !== oldUsername) {
    const checkQ = query(usersCol, where("username", "==", newUsername));
    const checkSnap = await getDocs(checkQ);
    if (!checkSnap.empty) {
      return { success: false, error: 'اسم المستخدم الجديد موجود بالفعل' };
    }
  }

  const userDoc = snapshot.docs[0];
  const updateData: any = {};
  if (newUsername) updateData.username = newUsername;
  if (newPassword) updateData.password = newPassword;
  if (newComplex) updateData.complex = newComplex;

  await updateDoc(doc(db, 'users', userDoc.id), updateData);
  return { success: true, message: 'تم تحديث البيانات بنجاح' };
};

export const deleteUser = async (username: string): Promise<any> => {
  const q = query(usersCol, where("username", "==", username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return { success: false, error: 'المستخدم غير موجود' };
  }
  await deleteDoc(doc(db, 'users', snapshot.docs[0].id));
  return { success: true, message: 'تم حذف المستخدم بنجاح' };
};

// Excel File Management
export const saveExcelToFirestore = async (arrayBuffer: ArrayBuffer): Promise<any> => {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64String = btoa(binary);
  
  await setDoc(doc(db, 'files', 'data_xlsx'), { content: base64String });
  return { success: true };
};

export const loadExcelFromFirestore = async () => {
  const fileDoc = await getDoc(doc(db, 'files', 'data_xlsx'));
  if (fileDoc.exists()) {
    const base64String = fileDoc.data().content;
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  return null;
};

// Teacher Records Management
export interface TeacherRecord {
  id?: string;
  complexName?: string;
  academicYear?: string;
  jobNum: string;
  name: string;
  nationality: string;
  section: string;
  track?: string;
  stage?: string;
  jobTitle?: string;
  nationalId: string;
  phone: string;
  quota: string;
  qualification: string;
  specialization: string;
  subject: string;
  license: string;
  classera: string;
  email: string;
  iban: string;
  bank: string;
  startDate: string;
  createdAt?: string;
}

const teachersCol = collection(db, 'teachers');

export const saveTeacherToFirestore = async (teacher: TeacherRecord): Promise<any> => {
  const docRef = await addDoc(teachersCol, {
    ...teacher,
    createdAt: new Date().toISOString()
  });
  return { success: true, id: docRef.id };
};

export const getTeachersFromFirestore = async (): Promise<TeacherRecord[]> => {
  const snapshot = await getDocs(teachersCol);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TeacherRecord));
};

export const deleteTeacherFromFirestore = async (id: string): Promise<any> => {
  await deleteDoc(doc(db, 'teachers', id));
  return { success: true };
};

export const updateTeacherInFirestore = async (id: string, teacher: Partial<TeacherRecord>): Promise<any> => {
  await updateDoc(doc(db, 'teachers', id), teacher);
  return { success: true };
};

// Administrative Staff Records Management
export interface AdminRecord {
  id?: string;
  complexName?: string;
  academicYear?: string;
  jobNum: string;
  name: string;
  nationality: string;
  section: string;
  track?: string;
  stage?: string;
  jobTitle?: string;
  nationalId: string;
  phone: string;
  qualification: string;
  specialization: string;
  license: string;
  email: string;
  iban: string;
  bank: string;
  startDate: string;
  createdAt?: string;
}

const adminStaffCol = collection(db, 'admin_staff');

export const saveAdminToFirestore = async (admin: AdminRecord): Promise<any> => {
  const docRef = await addDoc(adminStaffCol, {
    ...admin,
    createdAt: new Date().toISOString()
  });
  return { success: true, id: docRef.id };
};

export const getAdminsFromFirestore = async (): Promise<AdminRecord[]> => {
  const snapshot = await getDocs(adminStaffCol);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AdminRecord));
};

export const deleteAdminFromFirestore = async (id: string): Promise<any> => {
  await deleteDoc(doc(db, 'admin_staff', id));
  return { success: true };
};

export const updateAdminInFirestore = async (id: string, admin: Partial<AdminRecord>): Promise<any> => {
  await updateDoc(doc(db, 'admin_staff', id), admin);
  return { success: true };
};

// Support Staff Records Management (الخدمات المساندة)
export interface SupportStaffRecord {
  id?: string;
  complexName?: string;
  academicYear?: string;
  sponsorshipType?: 'على كفالة الشركة' | 'شركة مشغلة' | string;
  jobNum: string;
  name: string;
  nationality: string;
  section: string;
  stage?: string;
  jobTitle?: string;
  nationalId: string;
  phone: string;
  email: string;
  iban: string;
  bank: string;
  startDate: string;
  createdAt?: string;
}

const supportStaffCol = collection(db, 'support_staff');

export const saveSupportStaffToFirestore = async (staff: SupportStaffRecord): Promise<any> => {
  const docRef = await addDoc(supportStaffCol, {
    ...staff,
    createdAt: new Date().toISOString()
  });
  return { success: true, id: docRef.id };
};

export const getSupportStaffFromFirestore = async (): Promise<SupportStaffRecord[]> => {
  const snapshot = await getDocs(supportStaffCol);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportStaffRecord));
};

export const deleteSupportStaffFromFirestore = async (id: string): Promise<any> => {
  await deleteDoc(doc(db, 'support_staff', id));
  return { success: true };
};

export const updateSupportStaffInFirestore = async (id: string, staff: Partial<SupportStaffRecord>): Promise<any> => {
  await updateDoc(doc(db, 'support_staff', id), staff);
  return { success: true };
};

// Classes and Students Statistics Management (إحصاء الفصول والطلاب)
export interface ClassStatsRecord {
  id?: string;
  complexName?: string;
  academicYear?: string;
  track: string;              // المسار العام: أهلي / دولي / ...
  section: string;            // القسم: بنين / بنات
  stage: string;              // المرحلة: تمهيدي / ابتدائي / متوسط / ثانوي
  grade: string;              // الصف: KG 1 / أول ابتدائي / ...
  classCount: number;         // عدد الفصول (1 إلى 10)
  secondaryTrack?: string;    // مسار المرحلة الثانوية التخصصي: مسار عام / مسار هندسة / مسار صحة وحياة / مسار إدارة
  studentType?: 'بنين' | 'بنات'; // نوع الطلاب (لغير التمهيدي)
  // أعداد الطلاب العامة
  saudiCount: number;         // عدد السعوديين
  nonSaudiCount: number;      // عدد غير السعوديين
  totalStudents: number;      // إجمالي عدد الطلاب في هذا الصف
  // تفصيل أعداد التمهيدي (بنين وبنات وسعودي وغير سعودي)
  kgBoysSaudi?: number;
  kgBoysNonSaudi?: number;
  kgGirlsSaudi?: number;
  kgGirlsNonSaudi?: number;
  createdAt?: string;
  updatedAt?: string;
}

const classStatsCol = collection(db, 'classes_stats');

export const saveClassStatsToFirestore = async (stats: ClassStatsRecord): Promise<any> => {
  const docRef = await addDoc(classStatsCol, {
    ...stats,
    createdAt: new Date().toISOString()
  });
  return { success: true, id: docRef.id };
};

export const getClassStatsFromFirestore = async (): Promise<ClassStatsRecord[]> => {
  const snapshot = await getDocs(classStatsCol);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClassStatsRecord));
};

export const deleteClassStatsFromFirestore = async (id: string): Promise<any> => {
  await deleteDoc(doc(db, 'classes_stats', id));
  return { success: true };
};

export const updateClassStatsInFirestore = async (id: string, stats: Partial<ClassStatsRecord>): Promise<any> => {
  await updateDoc(doc(db, 'classes_stats', id), {
    ...stats,
    updatedAt: new Date().toISOString()
  });
  return { success: true };
};

// ==========================================
// إدارة طلبات نقل الموظفين بين المجمعات
// ==========================================
export interface TransferRequestRecord {
  id?: string;
  employeeId?: string;
  employeeType: 'teacher' | 'admin' | 'support';
  employeeName: string;
  jobNum?: string;
  jobTitle?: string;
  nationalId?: string;
  fromComplex: string;
  toComplex: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  notes?: string;
  fullData?: any;
  createdAt?: string;
  resolvedAt?: string;
}

// أداة تنقية الكائنات لإزالة أي قيم undefined قبل إرسالها لفايربيس
export const sanitizeForFirestore = <T extends Record<string, any>>(obj: T): any => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) {
      continue;
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      clean[key] = sanitizeForFirestore(val);
    } else if (Array.isArray(val)) {
      clean[key] = val.filter(item => item !== undefined).map(item => 
        (item !== null && typeof item === 'object') ? sanitizeForFirestore(item) : item
      );
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

const transferRequestsCol = collection(db, 'transfer_requests');

export const createTransferRequest = async (req: TransferRequestRecord): Promise<any> => {
  const requestData = sanitizeForFirestore({
    employeeId: req.employeeId || '',
    employeeType: req.employeeType,
    employeeName: req.employeeName,
    jobNum: req.jobNum || '',
    jobTitle: req.jobTitle || '',
    nationalId: req.nationalId || '',
    fromComplex: req.fromComplex,
    toComplex: req.toComplex,
    status: 'pending',
    requestDate: req.requestDate || new Date().toISOString(),
    notes: req.notes || '',
    createdAt: new Date().toISOString()
  });

  const docRef = await addDoc(transferRequestsCol, requestData);
  return { success: true, id: docRef.id };
};

export const getTransferRequestsFromFirestore = async (): Promise<TransferRequestRecord[]> => {
  const snapshot = await getDocs(transferRequestsCol);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TransferRequestRecord));
};

export const updateTransferRequestStatus = async (
  requestId: string,
  status: 'approved' | 'rejected',
  reqData?: TransferRequestRecord
): Promise<any> => {
  try {
    const docRef = doc(db, 'transfer_requests', requestId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        status,
        resolvedAt: new Date().toISOString()
      });
    } else {
      // إذا لم يكن المستند موجوداً في فايربيس (مثلاً تم إنشاؤه محلياً في وضع عدم الاتصال)، نقوم بحفظه بـ setDoc
      await setDoc(docRef, sanitizeForFirestore({
        ...(reqData || {}),
        status,
        resolvedAt: new Date().toISOString()
      }), { merge: true });
    }
  } catch (err) {
    console.warn('Firestore transfer request update handled with fallback:', err);
  }

  // إذا تمت الموافقة، نقوم بنقل الموظف في جدول/مجموعة الكادر التابع له إلى المجمع المستهدف
  if (status === 'approved' && reqData) {
    const targetComplex = reqData.toComplex;
    const empId = reqData.employeeId;
    if (empId) {
      if (reqData.employeeType === 'teacher') {
        try {
          await updateDoc(doc(db, 'teachers', empId), { complexName: targetComplex });
        } catch (e) {
          console.warn('Could not update teacher complex in firestore:', e);
        }
      } else if (reqData.employeeType === 'admin') {
        try {
          await updateDoc(doc(db, 'admin_staff', empId), { complexName: targetComplex });
        } catch (e) {
          console.warn('Could not update admin complex in firestore:', e);
        }
      } else if (reqData.employeeType === 'support') {
        try {
          await updateDoc(doc(db, 'support_staff', empId), { complexName: targetComplex });
        } catch (e) {
          console.warn('Could not update support staff complex in firestore:', e);
        }
      }
    }
  }

  return { success: true };
};





