const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage({ type: '', text: '' });
    try {
      const data = await updateUser(user!.username, editUsername || undefined, editPassword || undefined, undefined);
      if (data.success) {
        setSettingsMessage({ type: 'success', text: 'تم تحديث البيانات بنجاح، سيتم تسجيل خروجك' });
        setTimeout(() => handleLogout(), 2000);
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
      const data = await addUser(addUsername, addPassword, 'user', addComplex);
      if (data.success) {
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
`;

// we need to replace what we have now starting from `const handleChangeCredentials = async` down to `const fetchUsers = async () => {`
code = code.replace(/const handleChangeCredentials = async \([\s\S]*?const fetchUsers = async \(\) => \{/, replacement);

fs.writeFileSync('src/App.tsx', code);
