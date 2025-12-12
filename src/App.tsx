import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { CustomerProvider } from './context/CustomerContext';
import { TabProvider, useTabs } from './context/TabContext';
import { Layout } from './components/Layout';
import { CustomerList } from './components/CustomerList';
import { CustomerForm } from './components/CustomerForm';
import { CustomerDetail } from './components/CustomerDetail';
import { CompanyInfo } from './components/CompanyInfo';
import { FinancialSubjects } from './components/FinancialSubjects';

import { SupplierTypes } from './components/SupplierTypes';
import { TransportTypes } from './components/TransportTypes';
import { BusinessTypes } from './components/BusinessTypes';
import { TradeTerms } from './components/TradeTerms';
import { SupplierList } from './components/SupplierList';
import { TMSDraft } from './components/TMSDraft';
import { TMSInProgress } from './components/TMSInProgress';
import { TMSCompleted } from './components/TMSCompleted';
import { TMSArchived } from './components/TMSArchived';
import { LoadingMethods } from './components/LoadingMethods';
import { PortManagement } from './components/PortManagement';
import { ExpenseApplication } from './components/ExpenseApplication';
import { Operations } from './components/Operations';
import { FundManagement } from './components/FundManagement';
import { AgingManagement } from './components/AgingManagement';
import { TaxCompliance } from './components/TaxCompliance';
import { ReportsAnalysis } from './components/ReportsAnalysis';

function AppContent() {
  const { tabs, activeTabId, openTab, setActiveTabId, closeTab } = useTabs();
  const { t } = useLanguage();

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Tab Content Renderer
  const renderTabContent = () => {
    if (!activeTab) return null;

    switch (activeTab.type) {
      case 'dashboard':
        return (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#64748b' }}>
            <img src="/src/assets/logo.png" alt="Logo" style={{ height: '60px', marginBottom: '20px', opacity: 0.5 }} />
            <h2>{t('welcomeToERP')}</h2>
            <p>{t('selectModuleToStart')}</p>
            <button
              onClick={() => openTab({ title: t('customers'), type: 'customer-list' })}
              style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
            >
              {t('openCRM')}
            </button>
          </div>
        );
      case 'customer-list':
        return (
          <CustomerList
            onAdd={() => openTab({ title: 'New Customer', type: 'customer-form' })}
            onSelect={(id) => openTab({ title: 'Customer Details', type: 'customer-detail', id: `customer-${id}`, data: { id } })}
          />
        );
      case 'customer-detail':
        return (
          <CustomerDetail
            id={activeTab.data.id}
            onBack={() => closeTab(activeTab.id)}
          />
        );
      case 'customer-form':
        return (
          <CustomerForm
            onCancel={() => closeTab(activeTab.id)}
            onSuccess={() => {
              closeTab(activeTab.id);
              // Optionally switch to list if open
              const listTab = tabs.find(t => t.type === 'customer-list');
              if (listTab) setActiveTabId(listTab.id);
            }}
          />
        );
      case 'supplier-list':
        return <SupplierList />;
      case 'company-info':
        return <CompanyInfo />;
      case 'supplier-types':
        return <SupplierTypes />;
      case 'transport-types':
        return <TransportTypes />;
      case 'business-types':
        return <BusinessTypes />;
      case 'trade-terms':
        return <TradeTerms />;
      case 'tms-draft':
        return <TMSDraft />;
      case 'tms-in-progress':
        return <TMSInProgress />;
      case 'tms-completed':
        return <TMSCompleted />;
      case 'tms-archived':
        return <TMSArchived />;
      case 'loading-methods':
        return <LoadingMethods />;
      case 'port-management':
        return <PortManagement />;
      case 'financial-subjects':
        return <FinancialSubjects />;
      case 'expense-application':
        return <ExpenseApplication />;
      case 'operations':
        return <Operations />;
      case 'fund-management':
        return <FundManagement />;
      case 'aging-management':
        return <AgingManagement />;
      case 'tax-compliance':
        return <TaxCompliance />;
      case 'reports-analysis':
        return <ReportsAnalysis />;

      default:
        return <div>Unknown Tab Type: {activeTab.type}</div>;
    }
  };

  return (
    <Layout>
      {renderTabContent()}
    </Layout>
  );
}

function App() {
  return (
    <LanguageProvider>
      <CustomerProvider>
        <TabProvider>
          <AppContent />
        </TabProvider>
      </CustomerProvider>
    </LanguageProvider>
  );
}

export default App;
