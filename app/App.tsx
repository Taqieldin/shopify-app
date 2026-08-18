import React, { useState, useEffect } from 'react';
import { AppProvider } from '@shopify/polaris';
import { AdminLayout } from './admin/components/AdminLayout';
import { ProductsView } from './admin/components/ProductsView';
import { TagsView } from './admin/components/TagsView';
import { ServicesView } from './admin/components/ServicesView';
import { ProductPassport } from './public/ProductPassport';

function getTabFromHash(): string {
  if (typeof window === 'undefined') return 'products';
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('passport-')) return 'public-passport';
  if (['products', 'tags', 'services'].includes(hash)) return hash;
  return 'products';
}

function getSerialFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('passport-')) return hash.replace('passport-', '');
  return null;
}

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(() => getTabFromHash());
  const [viewingSerial, setViewingSerial] = useState<string | null>(() => getSerialFromHash());

  useEffect(() => {
    function onHashChange() {
      setCurrentTab(getTabFromHash());
      setViewingSerial(getSerialFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (currentTab === 'public-passport' && viewingSerial) {
    return (
      <AppProvider i18n={{}}>
        <ProductPassport serial={viewingSerial} />
      </AppProvider>
    );
  }

  return (
    <AppProvider i18n={{}}>
      <AdminLayout currentTab={currentTab} onSelectTab={(tab) => { window.location.hash = tab; }}>
        {currentTab === 'products' && <ProductsView />}
        {currentTab === 'tags' && <TagsView />}
        {currentTab === 'services' && <ServicesView />}
      </AdminLayout>
    </AppProvider>
  );
};

export default App;
