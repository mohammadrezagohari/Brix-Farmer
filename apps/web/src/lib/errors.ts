import type {Locale} from './i18n';

const locales = ['en','fa','pt','ru','zh','hi','ar','am','id','zu'] as const;
// Explicit translations for every supported interface language.
const copy = {
 failure: ['Request failed. Please try again.','درخواست انجام نشد. دوباره تلاش کنید.','Falha na solicitação. Tente novamente.','Не удалось выполнить запрос. Попробуйте снова.','请求失败，请重试。','अनुरोध विफल हुआ। फिर प्रयास करें।','تعذر تنفيذ الطلب. حاول مجددًا.','ጥያቄው አልተሳካም። እንደገና ይሞክሩ።','Permintaan gagal. Silakan coba lagi.','Isicelo sihlulekile. Zama futhi.'],
 supplier: ['A verified, active supplier is required. Verify the organization first.','تأمین‌کننده باید تأییدشده و فعال باشد. ابتدا سازمان را در بخش احراز هویت تأیید کنید.','O fornecedor deve estar verificado e ativo. Verifique a organização primeiro.','Поставщик должен быть проверен и активен. Сначала подтвердите организацию.','供应商必须已验证且处于活跃状态。请先验证组织。','आपूर्तिकर्ता सत्यापित और सक्रिय होना चाहिए। पहले संगठन सत्यापित करें।','يجب أن يكون المورّد معتمدًا ونشطًا. اعتمد المؤسسة أولًا.','አቅራቢው የተረጋገጠና ንቁ መሆን አለበት። መጀመሪያ ድርጅቱን ያረጋግጡ።','Pemasok harus terverifikasi dan aktif. Verifikasi organisasi terlebih dahulu.','Umphakeli kufanele aqinisekiswe futhi asebenze. Qinisekisa inhlangano kuqala.'],
 credentials: ['Email or password is incorrect.','ایمیل یا رمز عبور نادرست است.','E-mail ou senha incorretos.','Неверная почта или пароль.','邮箱或密码错误。','ईमेल या पासवर्ड गलत है।','البريد الإلكتروني أو كلمة المرور غير صحيحة.','ኢሜይሉ ወይም የይለፍ ቃሉ ትክክል አይደለም።','Email atau kata sandi salah.','I-imeyili noma iphasiwedi ayilungile.'],
 forbidden: ['You do not have permission. Active organization membership is required.','اجازه این عملیات را ندارید. عضویت فعال در سازمان لازم است.','Sem permissão. É necessário ser membro ativo da organização.','Нет доступа. Требуется активное членство в организации.','无权执行此操作，需要有效的组织成员资格。','अनुमति नहीं है। संगठन की सक्रिय सदस्यता आवश्यक है।','لا تملك الصلاحية. تلزم عضوية نشطة في المؤسسة.','ፈቃድ የለዎትም። ንቁ የድርጅት አባልነት ያስፈልጋል።','Anda tidak memiliki izin. Keanggotaan organisasi aktif diperlukan.','Awunayo imvume. Kudingeka ubulungu obusebenzayo benhlangano.'],
 login: ['Your session has expired. Sign in again.','نشست شما منقضی شده است. دوباره وارد شوید.','Sua sessão expirou. Entre novamente.','Сессия истекла. Войдите снова.','会话已过期，请重新登录。','सत्र समाप्त हो गया है। फिर से साइन इन करें।','انتهت جلستك. سجّل الدخول مجددًا.','ክፍለ ጊዜዎ አልቋል። እንደገና ይግቡ።','Sesi Anda berakhir. Masuk kembali.','Isikhathi sakho siphelile. Ngena futhi.'],
 missing: ['The record was not found or is unavailable.','رکورد موردنظر پیدا نشد یا در دسترس نیست.','Registro não encontrado ou indisponível.','Запись не найдена или недоступна.','记录不存在或不可用。','रिकॉर्ड नहीं मिला या उपलब्ध नहीं है।','السجل غير موجود أو غير متاح.','መዝገቡ አልተገኘም ወይም አይገኝም።','Data tidak ditemukan atau tidak tersedia.','Irekhodi alitholakalanga noma alitholakali.'],
 throttle: ['Too many requests. Wait and try again.','تعداد درخواست‌ها زیاد است. کمی صبر کنید و دوباره تلاش کنید.','Muitas solicitações. Aguarde e tente novamente.','Слишком много запросов. Подождите и повторите.','请求过多，请稍后重试。','बहुत अधिक अनुरोध। कुछ देर बाद प्रयास करें।','طلبات كثيرة جدًا. انتظر ثم حاول مجددًا.','በጣም ብዙ ጥያቄዎች። ቆይተው እንደገና ይሞክሩ።','Terlalu banyak permintaan. Tunggu dan coba lagi.','Izicelo ziningi kakhulu. Linda bese uzama futhi.'],
 validation: ['Check the entered values and required fields.','مقادیر واردشده و فیلدهای الزامی را بررسی کنید.','Confira os valores e campos obrigatórios.','Проверьте значения и обязательные поля.','请检查输入值和必填项。','दर्ज मान और आवश्यक फ़ील्ड जाँचें।','تحقق من القيم والحقول المطلوبة.','ያስገቡትን መረጃ እና አስፈላጊ መስኮች ያረጋግጡ።','Periksa nilai dan kolom wajib.','Hlola amanani nezinkambu ezidingekayo.'],
 legal: ['Complete the legal name, registration number, country and address first.','ابتدا نام حقوقی، شماره ثبت، کشور و نشانی را تکمیل کنید.','Preencha nome legal, registro, país e endereço.','Заполните юридическое название, регистрационный номер, страну и адрес.','请先填写法定名称、注册号、国家和地址。','पहले कानूनी नाम, पंजीकरण संख्या, देश और पता भरें।','أكمل الاسم القانوني ورقم التسجيل والبلد والعنوان أولًا.','መጀመሪያ ሕጋዊ ስም፣ የምዝገባ ቁጥር፣ አገር እና አድራሻ ይሙሉ።','Lengkapi nama hukum, nomor registrasi, negara dan alamat.','Gcwalisa igama elisemthethweni, inombolo yokubhalisa, izwe nekheli.'],
 stock: ['Insufficient available inventory.','موجودی آزاد کافی نیست.','Estoque disponível insuficiente.','Недостаточно свободных запасов.','可用库存不足。','उपलब्ध भंडार अपर्याप्त है।','المخزون المتاح غير كافٍ.','ያለው ክምችት በቂ አይደለም።','Persediaan tersedia tidak cukup.','Impahla etholakalayo ayanele.'],
 minimum: ['Quantity is below the minimum order.','مقدار از حداقل سفارش کمتر است.','Quantidade abaixo do pedido mínimo.','Количество меньше минимального заказа.','数量低于最低订购量。','मात्रा न्यूनतम ऑर्डर से कम है।','الكمية أقل من الحد الأدنى للطلب.','መጠኑ ከዝቅተኛው ትዕዛዝ በታች ነው።','Jumlah di bawah pesanan minimum.','Inani lingaphansi kwe-oda elincane.'],
 conflict: ['This action is not allowed in the current state. Refresh and check the record.','این عملیات در وضعیت فعلی مجاز نیست. صفحه را تازه و وضعیت رکورد را بررسی کنید.','Ação indisponível no estado atual. Atualize e confira o registro.','Действие недоступно в текущем состоянии. Обновите запись.','当前状态不允许此操作，请刷新并检查记录。','वर्तमान स्थिति में यह कार्य संभव नहीं है। रिकॉर्ड ताज़ा करके जाँचें।','الإجراء غير مسموح في الحالة الحالية. حدّث الصفحة وتحقق من السجل.','ይህ ተግባር በአሁኑ ሁኔታ አይፈቀድም። መዝገቡን ያድሱና ያረጋግጡ።','Tindakan tidak diizinkan pada status ini. Muat ulang dan periksa data.','Lesi senzo asivunyelwe kulesi simo. Vuselela uhlole irekhodi.'],
 suspended: ['This account is suspended. Contact the administrator.','این حساب تعلیق شده است. با مدیر سامانه تماس بگیرید.','Esta conta está suspensa. Contate o administrador.','Аккаунт заблокирован. Обратитесь к администратору.','账户已停用，请联系管理员。','यह खाता निलंबित है। व्यवस्थापक से संपर्क करें।','هذا الحساب معلّق. تواصل مع المسؤول.','ይህ መለያ ታግዷል። አስተዳዳሪውን ያነጋግሩ።','Akun ini ditangguhkan. Hubungi administrator.','Le akhawunti imisiwe. Xhumana nomlawuli.'],
} satisfies Record<string, readonly string[]>;
export const errorDictionaries = Object.fromEntries(locales.map((locale,index)=>[locale,Object.fromEntries(Object.entries(copy).map(([key,row])=>[key,row[index]]))])) as Record<Locale,Record<keyof typeof copy,string>>;
const known:Record<string,keyof typeof copy> = {
 'Verified supplier required.':'supplier','Supplier is not eligible.':'supplier',
 'Invalid credentials.':'credentials','Account suspended.':'suspended',
 'Active organization membership required.':'forbidden','Complete legal profile required.':'legal',
 'Published listing required.':'missing','Insufficient available inventory.':'stock',
 'Below minimum order quantity.':'minimum',
 'Idempotency key reused with different input.':'conflict','Cannot reserve your own lot.':'conflict',
 'Administrator accounts cannot be suspended here.':'conflict','Only submitted listings can be reviewed.':'conflict',
 'Withdraw from review before editing.':'conflict','Submitted stock quantities and origin cannot be edited. Create a new harvest lot.':'conflict',
 'Invalid listing transition.':'conflict','Quantity exceeds storage limit.':'validation',
};
export class RequestError extends Error {
 status:number;
 payload:{message?:string;errors?:Record<string,string[]>};
 constructor(status:number, payload:{message?:string;errors?:Record<string,string[]>}) {
  super(payload.message || 'Request failed');this.status=status;this.payload=payload;
 }
}
export function localizeError(error:unknown,locale:Locale):string {
 const payload=error instanceof RequestError?error.payload:undefined;
 const message=payload?.message || (error instanceof Error?error.message:String(error));
 const status=error instanceof RequestError?error.status:0;
 const kind=known[message] || (status===401||status===419?'login':status===403?'forbidden':status===404?'missing':status===429?'throttle':payload?.errors||status===422?'validation':status===409?'conflict':'failure');
 return errorDictionaries[locale][kind];
}
