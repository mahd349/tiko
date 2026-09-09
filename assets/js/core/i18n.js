/* ================================================================
   ROUTINE — CORE / I18N.JS
   Key-based Persian / English translation layer.
================================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "pd_lang";

  const dictionary = {
    fa: {
      "app.name": "روتین",
      "app.tagline": "پیگیری عادت، مدیریت وظایف و برنامه‌ریزی روزانه",

      "nav.home": "خانه",
      "nav.tasks": "وظایف",
      "nav.habits": "عادت‌ها",
      "nav.today": "امروز",
      "nav.calendar": "تقویم",
      "nav.stats": "گزارش‌ها",
      "nav.theme": "پوسته",
      "nav.tools": "ابزارها",

      "auth.login": "ورود با گوگل",
      "auth.logout": "خروج از حساب",
      "auth.loading": "در حال ورود...",
      "auth.connected": "متصل شد",
      "auth.error": "ورود ناموفق بود",

      "hero.greeting": "سلام",
      "hero.subtitle": "امروز یک قدم کوچک هم حساب می‌شود.",
      "hero.time": "زمان",

      "common.add": "افزودن",
      "common.save": "ذخیره",
      "common.cancel": "انصراف",
      "common.delete": "حذف",
      "common.edit": "ویرایش",
      "common.close": "بستن",
      "common.search": "جستجو",
      "common.all": "همه",
      "common.today": "امروز",
      "common.done": "انجام شده",
      "common.pending": "در انتظار",
      "common.overdue": "عقب‌افتاده",
      "common.open": "باز",
      "common.backup": "پشتیبان",
      "common.restore": "بازیابی",
      "common.reset": "پاک‌کردن",
      "common.download": "دانلود",
      "common.share": "اشتراک‌گذاری",
      "common.copy": "کپی",
      "common.install": "نصب",
      "common.theme": "پوسته",
      "common.language": "زبان",
      "common.settings": "تنظیمات",
      "common.tools": "ابزارها",
      "common.articles": "مقاله‌ها",
      "common.help": "راهنما",
      "common.streakCard": "کارت استریک",
      "common.viewAll": "مشاهده همه ←",
      "common.optional": "اختیاری",
      "common.goal": "هدف",
      "common.color": "رنگ",
      "common.icon": "نماد",
      "common.category": "دسته‌بندی",
      "common.type": "نوع",
      "common.date": "تاریخ",
      "common.priority": "اولویت",
      "common.name": "نام",

      "tasks.title": "وظایف",
      "tasks.subtitle": "کارهای روزانه را با تاریخ و اولویت مرتب کن.",
      "tasks.formTitle": "افزودن وظیفه",
      "tasks.namePlaceholder": "نام وظیفه…",
      "tasks.newBtn": "+ وظیفه جدید",
      "tasks.listTitle": "همه وظایف",
      "tasks.clearDone": "🧹 پاک‌کردن انجام‌شده‌ها",
      "tasks.searchPlaceholder": "جستجو در وظایف…",
      "tasks.emptyTitle": "وظیفه‌ای یافت نشد",
      "tasks.emptySub": "اولین وظیفهٔ خود را از فرم بالا اضافه کنید.",
      "tasks.selectedDate": "تاریخ انتخاب‌شده:",
      "tasks.priorityHigh": "🔴 مهم",
      "tasks.priorityMed": "🟡 معمولی",
      "tasks.priorityLow": "⚪ کم‌اهمیت",

      "habits.title": "عادت‌ها",
      "habits.subtitle": "عادت‌ها را بر اساس دسته‌بندی مدیریت و پیشرفتشان را دنبال کن.",
      "habits.formTitle": "افزودن عادت",
      "habits.namePlaceholder": "نام عادت…",
      "habits.typeNote": "✓ چک‌باکس · 🔢 عددی · ⏱ تایمر",
      "habits.searchPlaceholder": "جستجو در عادت‌ها…",
      "habits.myHabits": "عادت‌های من",
      "habits.emptyTitle": "عادتی یافت نشد",
      "habits.emptySub": "با یک عادت کوچک شروع کنید — مثلاً ۱۰ دقیقه مطالعه.",
      "habits.goalHint": "هدف اختیاری است؛ نوار پیشرفت فقط با هدف نمایش داده می‌شود.",
      "habits.typeCheckbox": "✅ چک‌باکس",
      "habits.typeTimer": "⏱️ تایمر",
      "habits.typeNumber": "🔢 عددی",
      "habits.done": "✅ انجام شد",
      "habits.notDone": "⬜ انجام نشده",
      "habits.start": "▶️ شروع",
      "habits.stop": "⏹️ توقف",
      "habits.streakStart": "شروع کنید",
      "habits.record": "رکورد:",
      "habits.of": "از",
      "habits.goalMinutes": "هدف {goal} دقیقه",

      "category.health": "سلامت",
      "category.fitness": "ورزش",
      "category.learning": "یادگیری",
      "category.work": "کار",
      "category.personal": "شخصی",
      "category.finance": "مالی",
      "category.art": "هنر",
      "category.home": "خانه",

      "today.title": "امروز",
      "today.subtitle": "وضعیت کامل همین روز در یک صفحه.",
      "today.progress": "پیشرفت",
      "today.tasks": "📋 وظایف امروز",
      "today.remainingHabits": "🔥 عادت‌های باقی‌مانده",
      "today.tasksEmptyTitle": "وظیفه‌ای برای امروز نیست",
      "today.tasksEmptySub": "روز آزادی دارید — یا شاید وقتش است هدف تازه‌ای تعریف کنید.",
      "today.allHabitsDone": "همهٔ عادت‌های امروز انجام شد!",
      "today.noHabits": "هنوز عادتی ثبت نشده",

      "calendar.title": "تقویم",
      "calendar.subtitle": "روی هر روز بزن تا جزئیاتش را ببینی.",
      "calendar.eyebrow": "تقویم شمسی",
      "calendar.prevMonth": "ماه قبل",
      "calendar.nextMonth": "ماه بعد",
      "calendar.heatmapTitle": "نقشهٔ حرارتی",
      "calendar.heatmapEyebrow": "۶ ماه اخیر",
      "calendar.legendHabit": "عادت انجام‌شده",
      "calendar.legendTask": "وظیفه انجام‌شده",
      "calendar.emptyDay": "این روز فعالیتی ثبت نشده",

      "stats.title": "گزارش‌ها",
      "stats.subtitle": "روند پیشرفت، زمان تمرکز و عملکرد عادت‌ها.",
      "stats.eyebrow": "تحلیل",
      "stats.weeklyTitle": "نرخ تکمیل ۷ روز اخیر",
      "stats.trendTitle": "۳۰ روز اخیر",
      "stats.perHabitTitle": "نمودار هر عادت",
      "stats.dataTitle": "مدیریت داده‌ها",
      "stats.dataInfo": "حجم فعلی داده‌ها:",
      "stats.dataLocal": "داده‌ها فقط در همین مرورگر ذخیره می‌شوند.",
      "stats.export": "📥 دانلود پشتیبان",
      "stats.import": "📤 بازیابی",
      "stats.reset": "🗑️ پاک‌کردن همه",
      "stats.totalTasks": "کل وظایف",
      "stats.doneTasks": "انجام شده",
      "stats.totalHabits": "تعداد عادت‌ها",
      "stats.activeDays": "روزهای فعال",
      "stats.bestStreak": "بهترین استریک",
      "stats.focusHours": "ساعت تمرکز",
      "stats.completion": "نرخ تکمیل",

      "feedback.title": "نظرت را بگو",
      "feedback.note": "پیشنهاد، انتقاد یا باگ — هر پیامی مستقیم به ما می‌رسد.",
      "feedback.emailPlaceholder": "ایمیل (اختیاری)",
      "feedback.typeLabel": "نوع بازخورد",
      "feedback.bug": "گزارش باگ",
      "feedback.feature": "پیشنهاد ویژگی جدید",
      "feedback.general": "بازخورد عمومی",
      "feedback.messagePlaceholder": "پیام شما...",
      "feedback.send": "ارسال",
      "landing.features": "ویژگی‌های روتین",
      "landing.faq": "سوالات متداول",

      "toast.taskAdded": "✅ وظیفه اضافه شد",
      "toast.taskDeleted": "🗑️ وظیفه حذف شد",
      "toast.habitAdded": "✅ عادت اضافه شد",
      "toast.habitDeleted": "🗑️ عادت حذف شد",
      "toast.saved": "✅ ذخیره شد",
      "toast.restored": "↩️ بازگردانی شد",
      "toast.invalidFile": "❌ فایل نامعتبر است",
      "toast.storageFull": "❌ حافظهٔ مرورگر پر است — پشتیبان بگیرید",
      "toast.timerStarted": "▶️ تایمر شروع شد",
      "toast.newDay": "🌅 روز جدید شروع شد",
      "toast.imageDownloaded": "تصویر دانلود شد — حالا استوری‌اش کن 🔥",
      "toast.copyDone": "متن کپی شد ✅",
      "toast.copyFail": "مرورگر اجازهٔ کپی نداد",
      "toast.dataRestored": "📤 داده‌ها بازیابی شدند",
      "toast.dataReset": "🗑️ همهٔ داده‌ها پاک شد",
      "toast.enterTaskName": "❌ نام وظیفه را وارد کنید",
      "toast.enterHabitName": "❌ نام عادت را وارد کنید",
      "toast.nothingToClear": "چیزی برای پاک‌کردن نیست",
      "toast.nice": "🎉 آفرین!",
      "toast.updatedFromOtherTab": "🔄 داده‌ها از تب دیگر به‌روز شد",
      "toast.storageUnavailable": "ℹ️ حافظهٔ دائمی در این حالت در دسترس نیست",

      "modal.editTask": "✏️ ویرایش وظیفه",
      "modal.editHabit": "✏️ ویرایش عادت",
      "modal.deleteHabit": "🗑️ حذف عادت",
      "modal.deleteHabitDesc": "با حذف این عادت، تمام تاریخچه و استریک آن هم پاک می‌شود.",
      "modal.areYouSure": "مطمئن هستید؟",
      "modal.yesDelete": "بله، حذف کن",
      "modal.yesReset": "بله، پاک کن",
      "modal.backupFirst": "📥 اول پشتیبان",
      "modal.resetWarning": "تمام وظایف، عادت‌ها و تاریخچه برای همیشه پاک می‌شوند.",
      "modal.resetTitle": "⚠️ پاک‌کردن همهٔ داده‌ها"
       "share.title": "🔥 کارت استریک",
"share.selectHabit": "انتخاب عادت",
"share.download": "📥 دانلود تصویر",
"share.copyText": "📋 کپی متن",
"share.share": "📤 اشتراک‌گذاری",
"share.noHabits": "هنوز عادتی نداری. اول یک عادت بساز، بعد کارت استریک را دریافت کن.",
"share.imageError": "ساخت تصویر ناموفق بود",

"trash.title": "🗑️ سطل زباله",
"trash.empty": "سطل زباله خالی است.",
"trash.restore": "بازگردانی",
"trash.emptyTrash": "پاک‌کردن دائمی",
"trash.tasks": "وظایف حذف‌شده",
"trash.habits": "عادت‌های حذف‌شده",
"trash.confirmEmpty": "آیتم‌های سطل زباله برای همیشه حذف می‌شوند.",

"backup.previewTitle": "پیش‌نمایش بازیابی",
"backup.file": "فایل پشتیبان",
"backup.current": "دادهٔ فعلی",
"backup.tasks": "وظایف",
"backup.habits": "عادت‌ها",
"backup.days": "روزهای ثبت‌شده",
"backup.trash": "سطل زباله",
"backup.warning": "با بازیابی، دادهٔ فعلی جایگزین می‌شود.",
"backup.backupFirst": "📥 اول پشتیبان بگیر",
"backup.restoreNow": "♻️ بازیابی کن",
"backup.reminder": "۷ روز است پشتیبان نگرفته‌ای. داده‌هایت فقط روی همین مرورگر است.",
"backup.reminderAction": "پشتیبان بگیر"
   "datepicker.today": "امروز",
"datepicker.clear": "پاک کردن",
"datepicker.invalid": "تاریخ واردشده نامعتبر است",
"datepicker.placeholder": "مثلاً ۱۴۰۴/۱۱/۱۹"
   "reminder.title": "یادآور روزانه",
"reminder.enable": "فعال‌سازی یادآور",
"reminder.time": "ساعت یادآوری",
"reminder.notification": "اعلان مرورگر",
"reminder.enableNotification": "🔔 فعال‌سازی اعلان مرورگر",
"reminder.permGranted": "✅ فعال است",
"reminder.permDenied": "❌ مسدود شده (از تنظیمات مرورگر باز کن)",
"reminder.permDefault": "هنوز درخواست نشده",
"reminder.permUnsupported": "در این مرورگر پشتیبانی نمی‌شود",
"reminder.permUnknown": "نامشخص",
"reminder.remaining": "هنوز {tasks} وظیفه و {habits} عادت برای امروز باقی مانده. بیا چند تاشون رو تموم کنیم! 💪",
"reminder.allDone": "همهٔ کارهای امروز انجام شد! 🎉",
"reminder.openToday": "مشاهده امروز",
      "reminder.title": "یادآور روزانه",
"reminder.enable": "فعال‌سازی یادآور",
"reminder.time": "ساعت یادآوری",
"reminder.notification": "اعلان مرورگر",
"reminder.enableNotification": "🔔 فعال‌سازی اعلان مرورگر",
"reminder.permGranted": "✅ فعال است",
"reminder.permDenied": "❌ مسدود شده (از تنظیمات مرورگر باز کن)",
"reminder.permDefault": "هنوز درخواست نشده",
"reminder.permUnsupported": "در این مرورگر پشتیبانی نمی‌شود",
"reminder.permUnknown": "نامشخص",
"reminder.remaining": "هنوز {tasks} وظیفه و {habits} عادت برای امروز باقی مانده. بیا چند تاشون رو تموم کنیم! 💪",
"reminder.openToday": "مشاهده امروز",
    },

    en: {
      "app.name": "Routine",
      "app.tagline": "Habit tracking, task management and daily planning",

      "nav.home": "Home",
      "nav.tasks": "Tasks",
      "nav.habits": "Habits",
      "nav.today": "Today",
      "nav.calendar": "Calendar",
      "nav.stats": "Reports",
      "nav.theme": "Theme",
      "nav.tools": "Tools",

      "auth.login": "Sign in with Google",
      "auth.logout": "Sign out",
      "auth.loading": "Signing in...",
      "auth.connected": "Connected",
      "auth.error": "Sign-in failed",

      "hero.greeting": "Hello",
      "hero.subtitle": "Small wins still count.",
      "hero.time": "Time",

      "common.add": "Add",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.close": "Close",
      "common.search": "Search",
      "common.all": "All",
      "common.today": "Today",
      "common.done": "Done",
      "common.pending": "Pending",
      "common.overdue": "Overdue",
      "common.open": "Open",
      "common.backup": "Backup",
      "common.restore": "Restore",
      "common.reset": "Delete",
      "common.download": "Download",
      "common.share": "Share",
      "common.copy": "Copy",
      "common.install": "Install",
      "common.theme": "Theme",
      "common.language": "Language",
      "common.settings": "Settings",
      "common.tools": "Tools",
      "common.articles": "Articles",
      "common.help": "Help",
      "common.streakCard": "Streak card",
      "common.viewAll": "View all →",
      "common.optional": "Optional",
      "common.goal": "Goal",
      "common.color": "Color",
      "common.icon": "Icon",
      "common.category": "Category",
      "common.type": "Type",
      "common.date": "Date",
      "common.priority": "Priority",
      "common.name": "Name",

      "tasks.title": "Tasks",
      "tasks.subtitle": "Organise your daily work by date and priority.",
      "tasks.formTitle": "Add a task",
      "tasks.namePlaceholder": "Task name…",
      "tasks.newBtn": "+ New task",
      "tasks.listTitle": "All tasks",
      "tasks.clearDone": "🧹 Clear completed",
      "tasks.searchPlaceholder": "Search tasks…",
      "tasks.emptyTitle": "No tasks found",
      "tasks.emptySub": "Add your first task using the form above.",
      "tasks.selectedDate": "Selected date:",
      "tasks.priorityHigh": "🔴 Important",
      "tasks.priorityMed": "🟡 Normal",
      "tasks.priorityLow": "⚪ Low",

      "habits.title": "Habits",
      "habits.subtitle": "Manage habits by category and track their progress.",
      "habits.formTitle": "Add a habit",
      "habits.namePlaceholder": "Habit name…",
      "habits.typeNote": "✓ Checkbox · 🔢 Numeric · ⏱ Timer",
      "habits.searchPlaceholder": "Search habits…",
      "habits.myHabits": "My habits",
      "habits.emptyTitle": "No habits found",
      "habits.emptySub": "Start with one small habit — for example, 10 minutes of reading.",
      "habits.goalHint": "Goal is optional; the progress bar appears only when a goal is set.",
      "habits.typeCheckbox": "✅ Checkbox",
      "habits.typeTimer": "⏱️ Timer",
      "habits.typeNumber": "🔢 Numeric",
      "habits.done": "✅ Done",
      "habits.notDone": "⬜ Not done",
      "habits.start": "▶️ Start",
      "habits.stop": "⏹️ Stop",
      "habits.streakStart": "Get started",
      "habits.record": "Record:",
      "habits.of": "of",
      "habits.goalMinutes": "Goal: {goal} min",

      "category.health": "Health",
      "category.fitness": "Fitness",
      "category.learning": "Learning",
      "category.work": "Work",
      "category.personal": "Personal",
      "category.finance": "Finance",
      "category.art": "Creative",
      "category.home": "Home",

      "today.title": "Today",
      "today.subtitle": "Everything about today, on one page.",
      "today.progress": "Progress",
      "today.tasks": "📋 Today's tasks",
      "today.remainingHabits": "🔥 Remaining habits",
      "today.tasksEmptyTitle": "No tasks for today",
      "today.tasksEmptySub": "Your day is free — or it might be time to set a new goal.",
      "today.allHabitsDone": "All of today's habits are done!",
      "today.noHabits": "No habits yet",

      "calendar.title": "Calendar",
      "calendar.subtitle": "Tap any day to see its details.",
      "calendar.eyebrow": "Persian calendar",
      "calendar.prevMonth": "Previous month",
      "calendar.nextMonth": "Next month",
      "calendar.heatmapTitle": "Heatmap",
      "calendar.heatmapEyebrow": "Last 6 months",
      "calendar.legendHabit": "Habit done",
      "calendar.legendTask": "Task done",
      "calendar.emptyDay": "No activity recorded on this day",

      "stats.title": "Reports",
      "stats.subtitle": "Trends, focus time and habit performance.",
      "stats.eyebrow": "Analysis",
      "stats.weeklyTitle": "Completion rate, last 7 days",
      "stats.trendTitle": "Last 30 days",
      "stats.perHabitTitle": "Per-habit chart",
      "stats.dataTitle": "Data management",
      "stats.dataInfo": "Current data size:",
      "stats.dataLocal": "Data is stored only in this browser.",
      "stats.export": "📥 Download backup",
      "stats.import": "📤 Restore",
      "stats.reset": "🗑️ Delete all",
      "stats.totalTasks": "Total tasks",
      "stats.doneTasks": "Done",
      "stats.totalHabits": "Total habits",
      "stats.activeDays": "Active days",
      "stats.bestStreak": "Best streak",
      "stats.focusHours": "Focus hours",
      "stats.completion": "Completion rate",

      "feedback.title": "Share your thoughts",
      "feedback.note": "Suggestions, feedback or bugs — every message reaches us directly.",
      "feedback.emailPlaceholder": "Email (optional)",
      "feedback.typeLabel": "Feedback type",
      "feedback.bug": "Bug report",
      "feedback.feature": "Feature idea",
      "feedback.general": "General feedback",
      "feedback.messagePlaceholder": "Your message...",
      "feedback.send": "Send",
     "landing.features": "Routine features",
     "landing.faq": "Frequently asked questions",

      "toast.taskAdded": "✅ Task added",
      "toast.taskDeleted": "🗑️ Task deleted",
      "toast.habitAdded": "✅ Habit added",
      "toast.habitDeleted": "🗑️ Habit deleted",
      "toast.saved": "✅ Saved",
      "toast.restored": "↩️ Undone",
      "toast.invalidFile": "❌ Invalid file",
      "toast.storageFull": "❌ Browser storage is full — take a backup",
      "toast.timerStarted": "▶️ Timer started",
      "toast.newDay": "🌅 A new day has started",
      "toast.imageDownloaded": "Image downloaded — time to share it 🔥",
      "toast.copyDone": "Text copied ✅",
      "toast.copyFail": "The browser blocked copying",
      "toast.dataRestored": "📤 Data restored",
      "toast.dataReset": "🗑️ All data deleted",
      "toast.enterTaskName": "❌ Enter a task name",
      "toast.enterHabitName": "❌ Enter a habit name",
      "toast.nothingToClear": "There is nothing to clear",
      "toast.nice": "🎉 Nice work!",
      "toast.updatedFromOtherTab": "🔄 Data updated from another tab",
      "toast.storageUnavailable": "ℹ️ Persistent storage is unavailable in this mode",

      "modal.editTask": "✏️ Edit task",
      "modal.editHabit": "✏️ Edit habit",
      "modal.deleteHabit": "🗑️ Delete habit",
      "modal.deleteHabitDesc": "Deleting this habit will erase all of its history and streak.",
      "modal.areYouSure": "Are you sure?",
      "modal.yesDelete": "Yes, delete",
      "modal.yesReset": "Yes, delete everything",
      "modal.backupFirst": "📥 Back up first",
      "modal.resetWarning": "All tasks, habits and history will be permanently deleted.",
      "modal.resetTitle": "⚠️ Delete all data"
   "share.title": "🔥 Streak card",
"share.selectHabit": "Select habit",
"share.download": "📥 Download image",
"share.copyText": "📋 Copy text",
"share.share": "📤 Share",
"share.noHabits": "You don't have any habits yet. Create one first, then get your streak card.",
"share.imageError": "Could not generate the image",

"trash.title": "🗑️ Trash",
"trash.empty": "Trash is empty.",
"trash.restore": "Restore",
"trash.emptyTrash": "Delete permanently",
"trash.tasks": "Deleted tasks",
"trash.habits": "Deleted habits",
"trash.confirmEmpty": "Items in trash will be permanently deleted.",

"backup.previewTitle": "Restore preview",
"backup.file": "Backup file",
"backup.current": "Current data",
"backup.tasks": "Tasks",
"backup.habits": "Habits",
"backup.days": "Logged days",
"backup.trash": "Trash",
"backup.warning": "Restoring will replace your current data.",
"backup.backupFirst": "📥 Back up first",
"backup.restoreNow": "♻️ Restore now",
"backup.reminder": "You haven't backed up for 7 days. Your data exists only in this browser.",
"backup.reminderAction": "Take backup"
   "datepicker.today": "Today",
"datepicker.clear": "Clear",
"datepicker.invalid": "The entered date is invalid",
"datepicker.placeholder": "e.g. 1404/11/19"
"reminder.title": "Daily reminder",
"reminder.enable": "Enable reminder",
"reminder.time": "Reminder time",
"reminder.notification": "Browser notification",
"reminder.enableNotification": "🔔 Enable browser notifications",
"reminder.permGranted": "✅ Enabled",
"reminder.permDenied": "❌ Blocked (enable it in browser settings)",
"reminder.permDefault": "Not requested yet",
"reminder.permUnsupported": "Not supported in this browser",
"reminder.permUnknown": "Unknown",
"reminder.remaining": "You still have {tasks} tasks and {habits} habits left today. Let's knock out a few! 💪",
"reminder.allDone": "All done for today! 🎉",
"reminder.openToday": "View today",
   "reminder.title": "Daily reminder",
"reminder.enable": "Enable reminder",
"reminder.time": "Reminder time",
"reminder.notification": "Browser notification",
"reminder.enableNotification": "🔔 Enable browser notifications",
"reminder.permGranted": "✅ Enabled",
"reminder.permDenied": "❌ Blocked (enable it in browser settings)",
"reminder.permDefault": "Not requested yet",
"reminder.permUnsupported": "Not supported in this browser",
"reminder.permUnknown": "Unknown",
"reminder.remaining": "You still have {tasks} tasks and {habits} habits left today. Let's knock out a few! 💪",
"reminder.openToday": "View today",
    }
  };

  function getInitialLang() {
    try {
      const q = new URLSearchParams(window.location.search).get("lang");
      if (q === "en" || q === "fa") return q;
    } catch (error) {
      // ignore
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "fa") return saved;
    } catch (error) {
      // ignore
    }

    return "fa";
  }

  let lang = getInitialLang();
  const listeners = new Set();

  function replaceParams(text, params) {
    if (!params) return text;

    Object.keys(params).forEach(function (key) {
      text = text.split("{" + key + "}").join(String(params[key]));
    });

    return text;
  }

  const I18N = {
    get lang() {
      return lang;
    },

    t: function (key, params) {
      const table = dictionary[lang] || {};
      let text = table[key];

      if (text === undefined) {
        text = dictionary.fa[key];
      }

      if (text === undefined) {
        text = key;
      }

      return replaceParams(text, params);
    },

    faNum: function (value) {
      return lang === "fa"
        ? window.Utils.toFa(value)
        : String(value == null ? "" : value);
    },

    percent: function (value) {
      const v = Math.round(Number(value) || 0);
      return lang === "fa" ? window.Utils.toFa(v) + "٪" : v + "%";
    },

    days: function (n) {
      const count = Math.round(Number(n) || 0);

      if (lang === "en") {
        return count + (count === 1 ? " day" : " days");
      }

      return window.Utils.toFa(count) + " روز";
    },

    setLang: function (nextLang, persist = true) {
      if (nextLang !== "en" && nextLang !== "fa") {
        nextLang = "fa";
      }

      const changed = nextLang !== lang;
      lang = nextLang;

      document.documentElement.setAttribute("lang", lang);
      document.documentElement.setAttribute("dir", lang === "en" ? "ltr" : "rtl");

      if (persist) {
        try {
          localStorage.setItem(STORAGE_KEY, lang);
        } catch (error) {
          // ignore
        }
      }

      if (changed) {
        I18N.translateStatic(document);

        listeners.forEach(function (fn) {
          try {
            fn(lang);
          } catch (error) {
            console.error(error);
          }
        });

        document.dispatchEvent(
          new CustomEvent("i18n:changed", {
            detail: { lang: lang }
          })
        );
      }
    },

    toggleLang: function () {
      I18N.setLang(lang === "fa" ? "en" : "fa", true);
    },

    onChange: function (fn) {
      listeners.add(fn);

      return function () {
        listeners.delete(fn);
      };
    },

    translateStatic: function (root = document) {
      if (!root || !root.querySelectorAll) return;

      root.querySelectorAll("[data-i18n]").forEach(function (el) {
        el.textContent = I18N.t(el.getAttribute("data-i18n"));
      });

      root.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
        el.setAttribute(
          "placeholder",
          I18N.t(el.getAttribute("data-i18n-placeholder"))
        );
      });

      root.querySelectorAll("[data-i18n-title]").forEach(function (el) {
        el.setAttribute("title", I18N.t(el.getAttribute("data-i18n-title")));
      });

      root.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
        el.setAttribute(
          "aria-label",
          I18N.t(el.getAttribute("data-i18n-aria"))
        );
      });
    }
  };

  window.I18N = I18N;

  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", lang === "en" ? "ltr" : "rtl");
  I18N.translateStatic(document);
})();
