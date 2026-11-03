import { create } from 'zustand';
import axios from 'axios';

const STORAGE_KEY = 'parent_selected_child_id';

const useParentChildStore = create((set, get) => ({
  childrenList: [],
  selectedChildId: localStorage.getItem(STORAGE_KEY) || '',
  loadingChildren: false,

  setChildrenList: (children) => {
    const list = Array.isArray(children) ? children : [];
    const currentId = get().selectedChildId;
    
    // Check if current selected ID is valid within the loaded children
    const isValid = list.some(c => String(c._id) === String(currentId));
    let newId = currentId;

    if ((!currentId || !isValid) && list.length > 0) {
      newId = list[0]._id;
      localStorage.setItem(STORAGE_KEY, newId);
    } else if (list.length === 0) {
      newId = '';
      localStorage.removeItem(STORAGE_KEY);
    }

    set({ childrenList: list, selectedChildId: newId });
  },

  setSelectedChildId: (id) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ selectedChildId: id });
  },

  fetchChildren: async (token) => {
    if (!token) return;
    try {
      set({ loadingChildren: true });
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/parent/dashboard', config);
      const children = res.data?.children || [];
      get().setChildrenList(children);
      return children;
    } catch (err) {
      console.error('Failed to fetch parent children in store:', err);
      return [];
    } finally {
      set({ loadingChildren: false });
    }
  },

  getSelectedChild: () => {
    const { childrenList, selectedChildId } = get();
    return childrenList.find(c => String(c._id) === String(selectedChildId)) || childrenList[0] || null;
  }
}));

export default useParentChildStore;
