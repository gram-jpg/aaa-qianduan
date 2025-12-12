import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Language } from '../types';

interface Translations {
    [key: string]: {
        en: string;
        zh: string;
    };
}

const translations: Translations = {
    // App & Navigation
    appTitle: { en: 'Customer Management', zh: '客户管理' },
    // companyName removed to fix duplicate identifier
    dashboard: { en: 'Workplace', zh: '工作台' },

    // Sidebar
    workplace: { en: 'Workplace', zh: '工作台' },
    crm: { en: 'Customer Management (CRM)', zh: '客户管理 (CRM)' },
    srm: { en: 'Supplier Management (SRM)', zh: '供应商管理 (SRM)' },
    tms: { en: 'Transportation Management (TMS)', zh: '业务管理 (TMS)' },
    fms: { en: 'Financial Management (FMS)', zh: '财务会计 (FMS)' },
    settings: { en: 'ERP Settings', zh: 'ERP 设置' },
    dataMaintenance: { en: 'Data Maintenance', zh: '数据维护' },
    billing: { en: 'Billing & Settlement', zh: '开票与结算' },
    underDevelopment: { en: 'Under Development', zh: '开发中' },

    // TMS Module
    tmsDraft: { en: 'Draft', zh: '暂存' },
    tmsInProgress: { en: 'In Progress', zh: '操作中' },
    tmsCompleted: { en: 'Completed', zh: '已完成' },
    tmsArchived: { en: 'Archived', zh: '归档' },

    // Settings Module
    companyInfo: { en: 'Company Information', zh: '企业信息' },
    supplierTypes: { en: 'Supplier Types', zh: '供应商类型' },
    transportTypes: { en: 'Transport Types', zh: '运输类型' },
    businessTypes: { en: 'Business Types', zh: '业务类型' },
    tradeTerms: { en: 'Trade Terms', zh: '贸易条款' },
    loadingMethods: { en: 'Loading Methods', zh: '装载方式' },
    editInfo: { en: 'Edit Info', zh: '编辑信息' },
    saveChanges: { en: 'Save Changes', zh: '保存修改' },

    // Company Info Fields
    companyNameEn: { en: 'Company Name (English)', zh: '公司名称 (英文)' },
    companyNameTh: { en: 'Company Name (Thai)', zh: '公司名称 (泰文)' },
    addressEn: { en: 'Address (English)', zh: '地址 (英文)' },
    addressTh: { en: 'Address (Thai)', zh: '地址 (泰文)' },
    taxId: { en: 'Tax ID', zh: '税号' },
    bankName: { en: 'Bank Name', zh: '开户银行' },
    bankAddress: { en: 'Bank Address', zh: '银行地址' },
    bankAccountThb: { en: 'Account No. (THB)', zh: '银行账号 (THB)' },
    bankAccountUsd: { en: 'Account No. (USD)', zh: '银行账号 (USD)' },
    swiftCode: { en: 'SWIFT Code', zh: 'SWIFT CODE' },
    basicInformation: { en: 'Basic Information', zh: '基本信息' },
    bankInformation: { en: 'Bank Information', zh: '银行信息' },

    // Supplier Types
    nameChinese: { en: 'Name (Chinese)', zh: '名称 (中文)' },
    nameEnglish: { en: 'Name (English)', zh: '名称 (英文)' },
    addType: { en: 'Add Type', zh: '添加类型' },
    noSupplierTypes: { en: 'No supplier types defined.', zh: '暂无供应商类型。' },
    typeNameChinesePlaceholder: { en: 'Type Name (Chinese) e.g. Shipping Line', zh: '类型名称 (中文) 例如: 船公司' },
    typeNameEnglishPlaceholder: { en: 'Type Name (English) e.g. Shipping Line', zh: '类型名称 (英文) 例如: Shipping Line' },

    // Financial Subjects
    financialSubjects: { en: 'Financial Subjects', zh: '财务科目' },
    noFinancialSubjects: { en: 'No financial subjects defined.', zh: '暂无财务科目。' },
    subjectNameChinesePlaceholder: { en: 'Subject Name (Chinese) e.g. 关税', zh: '科目名称 (中文) 例如: 关税' },
    subjectNameEnglishPlaceholder: { en: 'Subject Name (English) e.g. ID', zh: '科目名称 (英文) 例如: ID' },
    addSubject: { en: 'Add Subject', zh: '添加科目' },

    // Customer Management
    customers: { en: 'Customer List', zh: '客户列表' },
    addCustomer: { en: 'Add Customer', zh: '添加客户' },
    searchPlaceholder: { en: 'Search customers...', zh: '搜索客户...' },
    shortName: { en: 'Short Name', zh: '公司简称' },
    bankBranch: { en: 'Branch', zh: '分行' },
    bankAccount: { en: 'Account Number', zh: '银行账号' },
    bankBranchCode: { en: 'Branch Code', zh: '分行代码' },
    mailingAddress: { en: 'Mailing Address', zh: '邮寄地址' },
    disable: { en: 'Disable', zh: '禁用' },
    enable: { en: 'Enable', zh: '启用' },
    disabled: { en: 'Disabled', zh: '禁用' },
    showDisabled: { en: 'Show Disabled', zh: '显示禁用客户' },
    onlyDisabled: { en: 'Only Disabled', zh: '仅显示禁用' },
    status: { en: 'Status', zh: '状态' },
    active: { en: 'Active', zh: '启用' },
    clearSelection: { en: 'Clear Selection', zh: '清除选择' },

    // Common Actions
    edit: { en: 'Edit', zh: '编辑' },
    save: { en: 'Save', zh: '保存' },
    cancel: { en: 'Cancel', zh: '取消' },
    delete: { en: 'Delete', zh: '删除' },
    actions: { en: 'Actions', zh: '操作' },
    viewDetails: { en: 'View Details', zh: '查看详情' },
    backToList: { en: 'Back to List', zh: '返回列表' },
    loading: { en: 'Loading...', zh: '加载中...' },

    // Messages
    noCustomers: { en: 'No customers found.', zh: '暂无客户。' },
    deleteConfirm: { en: 'Are you sure you want to delete this customer?', zh: '您确定要删除此客户吗?' },
    disableConfirm: { en: 'Are you sure you want to disable this customer?', zh: '您确定要禁用此客户吗?' },
    areYouSure: { en: 'Are you sure?', zh: '确定删除吗?' },
    saveFailed: { en: 'Save failed, please try again', zh: '保存失败，请重试' },
    duplicateData: { en: 'Duplicate data, cannot save', zh: '数据重复，无法保存' },

    // Dashboard
    welcomeToERP: { en: 'Welcome to Real Smart ERP', zh: '欢迎使用 Real Smart ERP' },
    selectModuleToStart: { en: 'Select a module from the sidebar to get started.', zh: '从左侧菜单选择模块开始使用。' },
    openCRM: { en: 'Open CRM', zh: '打开客户管理' },

    // Supplier Management
    suppliers: { en: 'Supplier List', zh: '供应商列表' },
    addSupplier: { en: 'Add Supplier', zh: '添加供应商' },
    entityType: { en: 'Entity Type', zh: '主体类型' },
    company: { en: 'Company', zh: '公司' },
    individual: { en: 'Individual', zh: '个人' },
    supplierType: { en: 'Supplier Type', zh: '供应商类别' },
    fullName: { en: 'Full Name', zh: '姓名' },
    companyName: { en: 'Company Name', zh: '公司名称' },
    address: { en: 'Address', zh: '地址' },
    taxIdIndividual: { en: 'Tax ID', zh: '纳税人识别号' },
    accountNoThb: { en: 'Account No (THB)', zh: '账号 (THB)' },
    accountNoUsd: { en: 'Account No (USD)', zh: '账号 (USD)' },
    currency: { en: 'Currency', zh: '币种' },
    accountNo: { en: 'Account No', zh: '账号' },
    addBankAccount: { en: 'Add Bank Account', zh: '添加银行账户' },
    removeBankAccount: { en: 'Remove', zh: '删除' },
    branchCode: { en: 'Branch Code', zh: '分行代码' },
    noSuppliers: { en: 'No suppliers found.', zh: '暂无供应商。' },
    selectSupplierType: { en: 'Select supplier type', zh: '选择供应商类别' },
    selectEntityType: { en: 'Select entity type', zh: '选择主体类型' },
    searchSuppliers: { en: 'Search suppliers...', zh: '搜索供应商...' },
    code: { en: 'Code', zh: '编码' },
    basicInfo: { en: 'Basic Information', zh: '基本信息' },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese as requested

    const t = (key: string): string => {
        const translation = translations[key];
        if (!translation) return key;
        return translation[language];
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
