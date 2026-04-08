import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  User, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  File, 
  X, 
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
import { 
  fetchAddressData, 
  fetchMccData, 
  fetchNrcData, 
  AddressRecord, 
  MccRecord, 
  NrcData 
} from '../lib/dataService';

// --- Types ---
interface FormData {
  id: string;
  onboard_by: string;
  applicant_email: string;
  merchant_phone_no: string;
  title: string;
  title_mm: string;
  last_name: string;
  last_name_mm: string;
  dob: string;
  father_name: string;
  gender: string;
  marital_status: string;
  contact_number: string;
  nrc_no: string;
  nrc_tsp: string;
  nrc_type: string;
  nrc_number: string;
  nrc_full: string;
  owner_region: string;
  owner_township: string;
  owner_district: string;
  owner_city_en: string;
  owner_city_mm: string;
  owner_postal_code: string;
  owner_house_no: string;
  owner_street: string;
  owner_house_no_mm: string;
  owner_street_mm: string;
  owner_full_address: string;
  merchant_label_en: string;
  merchant_label_mm: string;
  company_name_en: string;
  company_name_mm: string;
  company_short_name_en: string;
  company_short_name_mm: string;
  business_name_en: string;
  business_name_mm: string;
  mcc_group: string;
  mcc_name: string;
  mcc_code: string;
  dica_grn_rcdc: string;
  merchant_region: string;
  merchant_township: string;
  merchant_district: string;
  merchant_city_en: string;
  merchant_city_mm: string;
  merchant_postal_code: string;
  merchant_house_no_en: string;
  merchant_street_en: string;
  merchant_house_no_mm: string;
  merchant_street_mm: string;
  merchant_full_address: string;
  latitude: string;
  longitude: string;
  open_24_7: boolean;
}

const STEPS = [
  { id: 1, name: 'Application', label: 'Application Info', icon: FileText },
  { id: 2, name: 'Owner', label: 'Owner Information', icon: User },
  { id: 3, name: 'Address', label: 'Owner Address', icon: MapPin },
  { id: 4, name: 'Business', label: 'Business & Address', icon: Building2 },
  { id: 5, name: 'Docs', label: 'Documents', icon: Upload },
];

export default function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    id: 'MOB-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    onboard_by: '',
    applicant_email: '',
    merchant_phone_no: '',
    title: '',
    title_mm: '',
    last_name: '',
    last_name_mm: '',
    dob: '',
    father_name: '',
    gender: '',
    marital_status: 'Single',
    contact_number: '',
    nrc_no: '',
    nrc_tsp: '',
    nrc_type: '',
    nrc_number: '',
    nrc_full: '',
    owner_region: '',
    owner_township: '',
    owner_district: '',
    owner_city_en: '',
    owner_city_mm: '',
    owner_postal_code: '',
    owner_house_no: '',
    owner_street: '',
    owner_house_no_mm: '',
    owner_street_mm: '',
    owner_full_address: '',
    merchant_label_en: '',
    merchant_label_mm: '',
    company_name_en: '',
    company_name_mm: '',
    company_short_name_en: '',
    company_short_name_mm: '',
    business_name_en: '',
    business_name_mm: '',
    mcc_group: '',
    mcc_name: '',
    mcc_code: '',
    dica_grn_rcdc: '',
    merchant_region: '',
    merchant_township: '',
    merchant_district: '',
    merchant_city_en: '',
    merchant_city_mm: '',
    merchant_postal_code: '',
    merchant_house_no_en: '',
    merchant_street_en: '',
    merchant_house_no_mm: '',
    merchant_street_mm: '',
    merchant_full_address: '',
    latitude: '',
    longitude: '',
    open_24_7: true,
  });

  const [addressData, setAddressData] = useState<AddressRecord[]>([]);
  const [mccData, setMccData] = useState<MccRecord[]>([]);
  const [nrcData, setNrcData] = useState<NrcData | null>(null);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Effects ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [addr, mcc, nrc] = await Promise.all([
          fetchAddressData(),
          fetchMccData(),
          fetchNrcData()
        ]);
        setAddressData(addr);
        setMccData(mcc);
        setNrcData(nrc);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();

    // GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
      });
    }
  }, []);

  const fillDemoData = () => {
    setFormData(prev => ({
      ...prev,
      onboard_by: 'Employee',
      applicant_email: 'demo.merchant@example.com',
      merchant_phone_no: '09123456789',
      title: 'Mr.',
      title_mm: 'ဦး',
      last_name: 'Kyaw Kyaw',
      last_name_mm: 'ကျော်ကျော်',
      dob: '1990-01-01',
      father_name: 'U Ba',
      gender: 'Male',
      marital_status: 'Single',
      contact_number: '09123456789',
      nrc_no: '12',
      nrc_tsp: 'DABANA',
      nrc_type: '(N)',
      nrc_number: '123456',
      nrc_full: '12/DABANA(N)123456',
      owner_region: 'Yangon',
      owner_township: 'Dagon',
      owner_district: 'Yangon West',
      owner_city_en: 'Yangon',
      owner_city_mm: 'ရန်ကုန်',
      owner_postal_code: '11181',
      owner_house_no: 'No. 123',
      owner_street: 'Pyay Road',
      owner_house_no_mm: 'အမှတ် ၁၂၃',
      owner_street_mm: 'ပြည်လမ်း',
      owner_full_address: 'No. 123, Pyay Road, Dagon, Yangon',
      merchant_label_en: 'Demo Shop',
      merchant_label_mm: 'သရုပ်ပြဆိုင်',
      company_name_en: 'Demo Company Ltd',
      company_name_mm: 'သရုပ်ပြကုမ္ပဏီလီမိတက်',
      company_short_name_en: 'DCL',
      company_short_name_mm: 'သရုပ်ပြ',
      business_name_en: 'Demo Business',
      business_name_mm: 'သရုပ်ပြလုပ်ငန်း',
      mcc_group: 'Retail',
      mcc_name: 'Grocery Stores',
      mcc_code: '5411',
      dica_grn_rcdc: 'DICA-123456',
      merchant_region: 'Yangon',
      merchant_township: 'Dagon',
      merchant_district: 'Yangon West',
      merchant_city_en: 'Yangon',
      merchant_city_mm: 'ရန်ကုန်',
      merchant_postal_code: '11181',
      merchant_house_no_en: 'No. 123',
      merchant_street_en: 'Pyay Road',
      merchant_house_no_mm: 'အမှတ် ၁၂၃',
      merchant_street_mm: 'ပြည်လမ်း',
      merchant_full_address: 'No. 123, Pyay Road, Dagon, Yangon',
      latitude: '16.8409',
      longitude: '96.1735',
    }));
  };

  const resetForm = () => {
    setFormData({
      id: 'MOB-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      onboard_by: '',
      applicant_email: '',
      merchant_phone_no: '',
      title: '',
      title_mm: '',
      last_name: '',
      last_name_mm: '',
      dob: '',
      father_name: '',
      gender: '',
      marital_status: 'Single',
      contact_number: '',
      nrc_no: '',
      nrc_tsp: '',
      nrc_type: '',
      nrc_number: '',
      nrc_full: '',
      owner_region: '',
      owner_township: '',
      owner_district: '',
      owner_city_en: '',
      owner_city_mm: '',
      owner_postal_code: '',
      owner_house_no: '',
      owner_street: '',
      owner_house_no_mm: '',
      owner_street_mm: '',
      owner_full_address: '',
      merchant_label_en: '',
      merchant_label_mm: '',
      company_name_en: '',
      company_name_mm: '',
      company_short_name_en: '',
      company_short_name_mm: '',
      business_name_en: '',
      business_name_mm: '',
      mcc_group: '',
      mcc_name: '',
      mcc_code: '',
      dica_grn_rcdc: '',
      merchant_region: '',
      merchant_township: '',
      merchant_district: '',
      merchant_city_en: '',
      merchant_city_mm: '',
      merchant_postal_code: '',
      merchant_house_no_en: '',
      merchant_street_en: '',
      merchant_house_no_mm: '',
      merchant_street_mm: '',
      merchant_full_address: '',
      latitude: '',
      longitude: '',
      open_24_7: true,
    });
    setFiles({});
    setCurrentStep(1);
    setIsSubmitted(false);
    setSameAddress(false);
    setErrors({});
  };

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const fieldId = id.replace('f_', '');
    
    setFormData(prev => {
      const updated = { ...prev, [fieldId]: value };
      
      // Sync names
      if (['company_name_en', 'company_short_name_en', 'business_name_en', 'merchant_label_en'].includes(fieldId)) {
        updated.merchant_label_en = value;
        updated.company_name_en = value;
        updated.company_short_name_en = value;
        updated.business_name_en = value;
      }
      if (['company_name_mm', 'company_short_name_mm', 'business_name_mm', 'merchant_label_mm'].includes(fieldId)) {
        updated.merchant_label_mm = value;
        updated.company_name_mm = value;
        updated.company_short_name_mm = value;
        updated.business_name_mm = value;
      }

      // Title & Gender
      if (fieldId === 'title') {
        updated.title_mm = value === 'U' ? 'ဦး' : value === 'Daw' ? 'ဒေါ်' : '';
        updated.gender = value === 'U' ? 'Male' : value === 'Daw' ? 'Female' : '';
      }

      // NRC Full
      if (['nrc_no', 'nrc_tsp', 'nrc_type', 'nrc_number'].includes(fieldId)) {
        const no = updated.nrc_no || '';
        const tsp = updated.nrc_tsp || '';
        const type = updated.nrc_type || '';
        const num = updated.nrc_number || '';
        updated.nrc_full = tsp ? `${no}/${tsp}(${type})${num}` : '';
      }

      // Auto-fill address details
      if (fieldId === 'owner_township' || fieldId === 'merchant_township') {
        const prefix = fieldId.startsWith('owner') ? 'owner' : 'merchant';
        const record = addressData.find(a => a.Township === value);
        if (record) {
          (updated as any)[`${prefix}_district`] = record.District;
          (updated as any)[`${prefix}_city_en`] = record['City EN'];
          (updated as any)[`${prefix}_city_mm`] = record['City MM'];
          (updated as any)[`${prefix}_postal_code`] = record['Postal Code'];
        }
      }

      // Full Address Strings
      const updateFullAddress = (p: 'owner' | 'merchant') => {
        const h = (updated as any)[`${p}_house_no${p === 'merchant' ? '_en' : ''}`] || '';
        const s = (updated as any)[`${p}_street${p === 'merchant' ? '_en' : ''}`] || '';
        const t = (updated as any)[`${p}_township`] || '';
        const d = (updated as any)[`${p}_district`] || '';
        const r = (updated as any)[`${p}_region`] || '';
        (updated as any)[`${p}_full_address`] = [h, s, t, d, r].filter(Boolean).join(', ');
      };

      if (fieldId.startsWith('owner_')) updateFullAddress('owner');
      if (fieldId.startsWith('merchant_')) updateFullAddress('merchant');

      // Auto-fill MCC group
      if (fieldId === 'mcc_name') {
        const record = mccData.find(m => m.mcc_name === value);
        if (record) {
          updated.mcc_code = record.mcc_code;
          updated.mcc_group = record.group;
        }
      }

      return updated;
    });
    
    // Clear error
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, zoneId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [zoneId]: file }));
    }
  };

  const handleSameAddressToggle = () => {
    setSameAddress(!sameAddress);
    if (!sameAddress) {
      setFormData(prev => ({
        ...prev,
        merchant_region: prev.owner_region,
        merchant_township: prev.owner_township,
        merchant_district: prev.owner_district,
        merchant_city_en: prev.owner_city_en,
        merchant_city_mm: prev.owner_city_mm,
        merchant_postal_code: prev.owner_postal_code,
        merchant_house_no_en: prev.owner_house_no,
        merchant_street_en: prev.owner_street,
        merchant_house_no_mm: prev.owner_house_no_mm,
        merchant_street_mm: prev.owner_street_mm,
        merchant_full_address: prev.owner_full_address
      }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    const required: Record<number, string[]> = {
      1: ['onboard_by', 'applicant_email'],
      2: ['merchant_phone_no', 'title', 'last_name', 'last_name_mm', 'dob', 'father_name', 'nrc_no', 'nrc_tsp', 'nrc_type', 'nrc_number'],
      3: ['owner_region', 'owner_township', 'owner_house_no', 'owner_street', 'owner_house_no_mm', 'owner_street_mm'],
      4: ['merchant_label_en', 'merchant_label_mm', 'mcc_group', 'mcc_name'],
    };

    (required[step] || []).forEach(field => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = 'Required';
      }
    });

    if (step === 1 && formData.applicant_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.applicant_email)) {
      newErrors.applicant_email = 'Invalid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const submitApplication = async () => {
    setIsSubmitting(true);
    try {
      // 1. Upload Files
      const filePaths: Record<string, string> = {};
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        const fileName = `${formData.id}/${key}_${Date.now()}_${file.name}`;
        const bucket = key === 'zone_shop_photo' ? 'merchant-photos' : 'merchant-docs';
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        filePaths[`doc_${key.replace('zone_', '')}`] = fileName;
      });

      // 2. Upload Signature (REMOVED)
      
      await Promise.all(uploadPromises);

      // 3. Insert Record
      const { error: insertError } = await supabase.from('merchant_applications').insert({
        ...formData,
        ...filePaths,
        status: 'pending',
        submitted_at: new Date().toISOString()
      });

      if (insertError) throw insertError;

      // 4. Timeline
      await supabase.from('application_timeline').insert({
        app_id: formData.id,
        action: 'Application Submitted',
        note: `Submitted via ${formData.onboard_by} channel`
      });

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Submission error (Full Object):', err);
      let msg = err.message || 'Unknown error';
      if (msg.toLowerCase().includes('apikey') || msg.toLowerCase().includes('jwt') || msg.includes('401')) {
        msg = 'Invalid API Key. Please ensure VITE_SUPABASE_ANON_KEY is correct in Netlify settings.';
      }
      alert('Submission failed: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('pdf-template');
    if (!element) {
      console.error('PDF template not found');
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Onboarding_${formData.id}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const PDFTemplate = () => (
    <div id="pdf-template" className="fixed -left-[9999px] top-0 w-[800px] bg-white p-10 text-slate-900 font-sans">
      <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter">SHWEBANK</h1>
          <p className="text-sm font-medium text-slate-500">MERCHANT ONBOARDING FORM</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-400 uppercase">Application ID</div>
          <div className="text-lg font-mono font-bold">{formData.id}</div>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xs font-bold bg-slate-100 p-2 mb-4 uppercase tracking-widest border-l-4 border-slate-900">1. Application Information</h2>
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold w-1/3">Onboarded By</td>
                <td className="border border-slate-200 p-2">{formData.onboard_by}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">Applicant Email</td>
                <td className="border border-slate-200 p-2">{formData.applicant_email}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xs font-bold bg-slate-100 p-2 mb-4 uppercase tracking-widest border-l-4 border-slate-900">2. Owner Information</h2>
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold w-1/3">Full Name (EN)</td>
                <td className="border border-slate-200 p-2">{formData.title} {formData.last_name}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">Full Name (MM)</td>
                <td className="border border-slate-200 p-2">{formData.title_mm} {formData.last_name_mm}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">Phone Number</td>
                <td className="border border-slate-200 p-2">{formData.merchant_phone_no}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">NRC Number</td>
                <td className="border border-slate-200 p-2">{formData.nrc_full}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">Date of Birth</td>
                <td className="border border-slate-200 p-2">{formData.dob}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">Father's Name</td>
                <td className="border border-slate-200 p-2">{formData.father_name}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xs font-bold bg-slate-100 p-2 mb-4 uppercase tracking-widest border-l-4 border-slate-900">3. Business Information</h2>
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold w-1/3">Company Name (EN)</td>
                <td className="border border-slate-200 p-2">{formData.company_name_en}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">Company Name (MM)</td>
                <td className="border border-slate-200 p-2">{formData.company_name_mm}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">Merchant Label (EN)</td>
                <td className="border border-slate-200 p-2">{formData.merchant_label_en}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">Merchant Label (MM)</td>
                <td className="border border-slate-200 p-2">{formData.merchant_label_mm}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">MCC</td>
                <td className="border border-slate-200 p-2">{formData.mcc_name} ({formData.mcc_code})</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">DICA / GRN / RCDC</td>
                <td className="border border-slate-200 p-2">{formData.dica_grn_rcdc || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xs font-bold bg-slate-100 p-2 mb-4 uppercase tracking-widest border-l-4 border-slate-900">4. Address Details</h2>
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <tbody>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold w-1/3">Owner Address</td>
                <td className="border border-slate-200 p-2">{formData.owner_full_address}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2 bg-slate-50 font-bold">Merchant Address</td>
                <td className="border border-slate-200 p-2">{formData.merchant_full_address}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="pt-12 flex justify-between items-end">
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-2"></div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Date</div>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-2"></div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Merchant Signature</div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Render Helpers ---
  const renderField = (id: string, label: string, type: string = 'text', placeholder: string = '', options: any[] = [], required = false, readonly = false) => {
    const fieldId = id.replace('f_', '');
    const hasError = errors[fieldId];

    return (
      <div className={`flex flex-col gap-1.5 flex-1 min-w-0 ${hasError ? 'text-danger' : ''}`}>
        <label className="text-[11px] font-medium text-text2 tracking-wider uppercase flex items-center gap-1">
          {label} {required && <span className="text-danger text-[10px]">*</span>}
        </label>
        {type === 'select' ? (
          <select 
            id={id} 
            value={formData[fieldId as keyof FormData] as string}
            onChange={handleInputChange}
            disabled={readonly}
            className={`w-full bg-surface2 border ${hasError ? 'border-danger' : 'border-border'} rounded-sm p-2.5 text-text text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 transition-all appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b9bb8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_13px_center] pr-9`}
          >
            <option value="">Select...</option>
            {options.map(opt => (
              <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
            ))}
          </select>
        ) : (
          <input 
            type={type} 
            id={id} 
            value={formData[fieldId as keyof FormData] as string}
            onChange={handleInputChange}
            placeholder={placeholder}
            readOnly={readonly}
            className={`w-full bg-surface2 border ${hasError ? 'border-danger' : 'border-border'} rounded-sm p-2.5 text-text text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 transition-all ${readonly ? 'bg-bg text-text3 border-dashed' : ''}`}
          />
        )}
        {hasError && <span className="text-[11px] text-danger">{hasError}</span>}
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <>
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-lg p-10 max-w-md w-full text-center"
          >
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold mb-2">Submitted!</h2>
            <p className="text-text2 mb-6">Your application has been received and is under review.</p>
            <div className="bg-bg p-4 rounded-sm font-mono text-sm text-text3 mb-8">
              {formData.id}
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={downloadPDF}
                className="btn btn-ghost w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Onboarding PDF
              </button>
              <button 
                onClick={resetForm}
                className="btn btn-primary w-full"
              >
                New Application
              </button>
            </div>
          </motion.div>
        </div>
        <PDFTemplate />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-bottom border-border p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-white">M</div>
        <h1 className="text-base font-semibold flex-1">Merchant Onboarding</h1>
        <div className="font-mono text-[11px] text-text3">{formData.id}</div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-4 flex gap-1">
        {STEPS.map((step, i) => (
          <div 
            key={step.id}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i + 1 <= currentStep ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="px-4 py-3 flex justify-between items-center">
        <span className="text-[13px] font-semibold text-accent2 uppercase tracking-wider">
          {STEPS[currentStep - 1].label}
        </span>
        <span className="text-xs text-text3 font-mono">{currentStep} / {STEPS.length}</span>
      </div>

      {/* Form Content */}
      <main className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-surface border border-border rounded-lg p-5 space-y-6"
          >
            {/* Step 1: Application */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-text3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-accent rounded-full" />
                    Application Information
                  </div>
                  <button 
                    onClick={fillDemoData}
                    className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-1 rounded-sm hover:bg-accent hover:text-white transition-all uppercase tracking-tighter"
                  >
                    ⚡ Fill Demo
                  </button>
                </div>
                <div className="flex gap-3">
                  {renderField('f_id', 'Application ID', 'text', '', [], false, true)}
                  {renderField('f_onboard_by', 'Onboard By', 'select', '', ['Customer', 'Employee'], true)}
                </div>
                {renderField('f_applicant_email', 'Applicant Email', 'email', 'applicant@email.com', [], true)}
              </div>
            )}

            {/* Step 2: Owner */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-text3 uppercase tracking-widest border-b border-border pb-3">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  Owner Information
                </div>
                {renderField('f_merchant_phone_no', 'Merchant Phone', 'tel', '09xxxxxxxxx', [], true)}
                <div className="flex gap-3">
                  <div className="w-24">{renderField('f_title', 'Title', 'select', '', ['U', 'Daw'], true)}</div>
                  {renderField('f_last_name', 'Last Name', 'text', 'Last name', [], true)}
                </div>
                <div className="flex gap-3">
                  <div className="w-24">{renderField('f_title_mm', 'Title (MM)', 'text', '', [], false, true)}</div>
                  {renderField('f_last_name_mm', 'Last Name (MM)', 'text', 'မြန်မာနာမည်', [], true)}
                </div>
                <div className="flex gap-3">
                  {renderField('f_dob', 'Date of Birth', 'date', '', [], true)}
                  {renderField('f_father_name', 'Father Name', 'text', 'Father\'s name', [], true)}
                </div>
                
                <div className="flex items-center gap-2 text-[13px] font-semibold text-text3 uppercase tracking-widest border-b border-border pb-3 pt-2">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  Owner NRC
                </div>
                <div className="flex gap-1.5 items-end">
                  <div className="w-20">{renderField('f_nrc_no', 'No', 'select', '', nrcData?.no || [], true)}</div>
                  <span className="text-text3 pb-3">/</span>
                  {renderField('f_nrc_tsp', 'Township', 'select', '', nrcData?.no_tsp?.[formData.nrc_no] || [], true)}
                  <span className="text-text3 pb-3">()</span>
                  <div className="w-24">{renderField('f_nrc_type', 'Type', 'select', '', nrcData?.type || [], true)}</div>
                </div>
                <div className="flex gap-3">
                  {renderField('f_nrc_number', 'NRC Number', 'text', '6 digits', [], true)}
                  {renderField('f_nrc_full', 'Full NRC', 'text', 'Auto', [], false, true)}
                </div>
              </div>
            )}

            {/* Step 3: Address */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-text3 uppercase tracking-widest border-b border-border pb-3">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  Owner Address
                </div>
                <div className="flex gap-3">
                  {renderField('f_owner_region', 'Region', 'select', '', [...new Set(addressData.map(a => a.Region))].sort(), true)}
                  {renderField('f_owner_township', 'Township', 'select', '', addressData.filter(a => a.Region === formData.owner_region).map(a => a.Township), true)}
                </div>
                <div className="flex gap-3">
                  {renderField('f_owner_house_no', 'House No', 'text', '', [], true)}
                  {renderField('f_owner_street', 'Street', 'text', '', [], true)}
                </div>
                <div className="flex gap-3">
                  {renderField('f_owner_house_no_mm', 'House No (MM)', 'text', 'အိမ်အမှတ်', [], true)}
                  {renderField('f_owner_street_mm', 'Street (MM)', 'text', 'လမ်းအမည်', [], true)}
                </div>
              </div>
            )}

            {/* Step 4: Business */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-text3 uppercase tracking-widest border-b border-border pb-3">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  Business Information
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {renderField('f_company_name_en', 'Company Name (EN)', 'text', '', [], true)}
                  {renderField('f_company_name_mm', 'Company Name (MM)', 'text', '', [], true)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {renderField('f_company_short_name_en', 'Short Name (EN)', 'text', '', [], true)}
                  {renderField('f_company_short_name_mm', 'Short Name (MM)', 'text', '', [], true)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {renderField('f_business_name_en', 'Business Name (EN)', 'text', '', [], true)}
                  {renderField('f_business_name_mm', 'Business Name (MM)', 'text', '', [], true)}
                </div>
                <div className="flex gap-3">
                  {renderField('f_merchant_label_en', 'Merchant Label (EN)', 'text', '', [], true, true)}
                  {renderField('f_merchant_label_mm', 'Merchant Label (MM)', 'text', '', [], true, true)}
                </div>
                <div className="flex gap-3">
                  {renderField('f_mcc_group', 'Group', 'select', '', [...new Set(mccData.map(m => m.group))].sort(), true)}
                  {renderField('f_mcc_name', 'MCC Name', 'select', '', mccData.filter(m => m.group === formData.mcc_group).map(m => m.mcc_name), true)}
                </div>
                {renderField('f_dica_grn_rcdc', 'DICA / GRN / RCDC', 'text')}

                <div className="flex items-center gap-2 text-[13px] font-semibold text-text3 uppercase tracking-widest border-b border-border pb-3 pt-2">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  Merchant Address
                </div>

                <div 
                  className="flex items-center gap-3 p-3.5 bg-bg border border-border rounded-sm cursor-pointer"
                  onClick={handleSameAddressToggle}
                >
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-text2">Same as Owner Address</div>
                    <div className="text-[11px] text-text3 mt-0.5">Auto-fill from owner details</div>
                  </div>
                  <div className={`w-11 h-6 rounded-full relative transition-colors ${sameAddress ? 'bg-accent' : 'bg-border2'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${sameAddress ? 'translate-x-5' : ''}`} />
                  </div>
                </div>

                {!sameAddress && (
                  <div className="space-y-6">
                    <div className="flex gap-3">
                      {renderField('f_merchant_region', 'Region', 'select', '', [...new Set(addressData.map(a => a.Region))].sort(), true)}
                      {renderField('f_merchant_township', 'Township', 'select', '', addressData.filter(a => a.Region === formData.merchant_region).map(a => a.Township), true)}
                    </div>
                    <div className="flex gap-3">
                      {renderField('f_merchant_house_no_en', 'House No (EN)', 'text', '', [], true)}
                      {renderField('f_merchant_street_en', 'Street (EN)', 'text', '', [], true)}
                    </div>
                    <div className="flex gap-3">
                      {renderField('f_merchant_house_no_mm', 'House No (MM)', 'text', 'အိမ်အမှတ်', [], true)}
                      {renderField('f_merchant_street_mm', 'Street (MM)', 'text', 'လမ်းအမည်', [], true)}
                    </div>
                    <div className="flex gap-3">
                      {renderField('f_latitude', 'Latitude', 'number')}
                      {renderField('f_longitude', 'Longitude', 'number')}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Docs */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-text3 uppercase tracking-widest border-b border-border pb-3">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  Documents & Media
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'business_doc', label: 'Business Doc', icon: FileText },
                    { id: 'agreement', label: 'Agreement', icon: File },
                    { id: 'bod', label: 'BOD', icon: Building2 },
                    { id: 'shop_photo', label: 'Shop Photo', icon: MapPin },
                    { id: 'nrc_front', label: 'NRC Front', icon: User },
                    { id: 'nrc_back', label: 'NRC Back', icon: User },
                  ].map(doc => (
                    <div key={doc.id} className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium text-text2 uppercase tracking-wider">{doc.label}</label>
                      <div 
                        className={`relative border-1.5 border-dashed rounded-sm p-4 text-center cursor-pointer transition-all hover:border-accent hover:bg-accent/5 ${files[`zone_${doc.id}`] ? 'border-success bg-success/5' : 'border-border2'}`}
                      >
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => handleFileChange(e, `zone_${doc.id}`)}
                        />
                        <doc.icon className="w-6 h-6 mx-auto mb-1.5 text-text2" />
                        <div className="text-[13px] font-medium text-text2">Upload</div>
                        <div className="text-[10px] text-text3 mt-0.5 truncate px-2">
                          {files[`zone_${doc.id}`]?.name || 'PDF, JPG, PNG'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Signature - REMOVED */}
            
            {/* Step 7: Preview - REMOVED */}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg/95 backdrop-blur-md border-t border-border flex flex-col gap-2 z-40">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button onClick={prevStep} className="btn btn-ghost flex items-center justify-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          
          {currentStep === STEPS.length ? (
            <button 
              onClick={submitApplication} 
              disabled={isSubmitting}
              className="btn btn-success flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          ) : (
            <button 
              onClick={nextStep} 
              className={`btn btn-primary flex items-center justify-center gap-2 ${currentStep === 1 ? 'w-full' : ''}`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Debug Info for Netlify Troubleshooting */}
        <div className="flex justify-center gap-4 text-[9px] font-mono text-text3 uppercase tracking-widest opacity-50">
          <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-success' : 'text-danger'}>
            URL: {import.meta.env.VITE_SUPABASE_URL ? 'LOADED' : 'MISSING'}
          </span>
          <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-success' : 'text-danger'}>
            KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'LOADED' : 'MISSING'}
          </span>
        </div>
      </div>

      <PDFTemplate />
    </div>
  );
}
