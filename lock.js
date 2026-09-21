/* ============================================================
   🔒 نظام القفل السحابي عبر JSONBin
   ملف مستقل — لا يعيد تعريف أي شيء من الكود الأصلي
============================================================ */

/* ⚠️ استبدل القيمتين بمفتاحك و BIN ID الحقيقيين */
var LOCK_JSONBIN_KEY = $2a$10$DlFnwp4tClzgzrmu1h/4mu/8PmEuQSObUi32eznyYOufFRmwQVTWW;
var LOCK_JSONBIN_BIN = 6ab05bc7ffd5d160531d6ed7;

/* ============================================================
   دوال JSONBin
============================================================ */
function lockReadState(){
  return fetch('https://api.jsonbin.io/v3/b/' + LOCK_JSONBIN_BIN + '/latest', {
    headers: {
      'X-Master-Key': LOCK_JSONBIN_KEY,
      'X-Bin-Meta': 'false'
    }
  })
  .then(function(res){
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(function(data){
    return data.locked === true;
  })
  .catch(function(err){
    console.error('lockReadState:', err);
    return null;
  });
}

function lockWriteState(locked){
  return fetch('https://api.jsonbin.io/v3/b/' + LOCK_JSONBIN_BIN, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': LOCK_JSONBIN_KEY
    },
    body: JSON.stringify({ locked: locked })
  })
  .then(function(res){
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return true;
  });
}

/* ============================================================
   استبدال زر القفل بمستمع سحابي
============================================================ */
function lockSetupButton(){
  var btn = document.getElementById('btnLock');
  if (!btn){
    /* إذا لم يكن الزر جاهزًا، انتظر ثم حاول مجددًا */
    setTimeout(lockSetupButton, 200);
    return;
  }

  /* استنساخ الزر لإزالة مستمع الحدث القديم */
  var fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);

  /* إضافة المستمع السحابي */
  fresh.addEventListener('click', function(){
    var msg = systemDisabled
      ? 'أدخل كلمة المرور لتفعيل النظام:'
      : 'أدخل كلمة المرور لتعطيل النظام:';

    var pass = prompt(msg);
    if (pass === null) return;
    if (pass !== 'osama'){
      toast('كلمة المرور غير صحيحة ✗');
      return;
    }

    var newState = !systemDisabled;

    lockWriteState(newState)
      .then(function(){
        systemDisabled = newState;
        applyLockState();   /* ← الدالة الأصلية في index.html */
        toast(newState
          ? 'تم تعطيل النظام على جميع الأجهزة 🔒'
          : 'تم تفعيل النظام على جميع الأجهزة ✓');
      })
      .catch(function(err){
        console.error('lockWriteState:', err);
        toast('حدث خطأ في الاتصال بالسيرفر ✗');
      });
  });
}

/* ============================================================
   التشغيل
============================================================ */
lockSetupButton();

/* قراءة الحالة الأولى عند التحميل */
lockReadState().then(function(locked){
  if (locked !== null){
    systemDisabled = locked;
    applyLockState();
  }
});

/* مزامنة دورية كل 5 ثوانٍ */
setInterval(function(){
  lockReadState().then(function(locked){
    if (locked === null) return;
    if (locked !== systemDisabled){
      systemDisabled = locked;
      applyLockState();
      toast(locked
        ? '🔒 تم تعطيل النظام على جميع الأجهزة'
        : '✓ تم تفعيل النظام');
    }
  });
}, 5000);
