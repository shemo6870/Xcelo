import { db } from './firebase';
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
