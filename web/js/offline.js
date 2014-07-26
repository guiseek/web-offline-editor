var editor, statusline, savebutton, idletimer;

window.onload = function() {
    if (localStorage.note == null) localStorage.note = "";
    if (localStorage.lastModified == null) localStorage.lastModified = 0;
    if (localStorage.lastSaved == null) localStorage.lastSaved = 0;

    editor = document.getElementById("editor");
    statusline = document.getElementById("statusline");
    savebutton = document.getElementById("savebutton");

    editor.value = localStorage.note;
    editor.disabled = true;

    editor.addEventListener("input",
        function (e) {
            localStorage.note = editor.value;
            localStorage.lastModified = Date.now();
            if (idletimer) clearTimeout(idletimer);
            idletimer = setTimeout(save, 5000);
            savebutton.disabled = false;
        },
        false
    );
    sync();
};

window.onbeforeunload = function() {
    if (localStorage.lastModified > localStorage.lastSaved)
        save();
};

window.onoffline = function() {
    console.log('Offline');
    status("Offline");
};

window.ononline = function() {
    console.log('Online');
    sync();
};

window.applicationCache.onupdateready = function() {
    console.log('Nova versão');
    status("Existe uma nova versão do aplicativo disponível. Recarregue a página para atualizar a versão");
    location.reload();
};

window.applicationCache.onnoupdate = function() {
    console.log('Versão atualizada');
    status("Estamos usando a última versão do aplicativo");
};

function status(msg) { statusline.innerHTML = msg; }

function save() {
    if (idletimer) clearTimeout(idletimer);
    idletimer = null;

    if (navigator.onLine) {
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", "/note");
        xhr.send(editor.value);
        xhr.onload = function() {
            localStorage.lastSaved = Date.now();
            savebutton.disabled = true;
            console.log('Nota atualizada');
        };
    }
}

function sync() {
   if (navigator.onLine) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/note");
        xhr.send();
        xhr.onload = function() {
            var remoteModTime = 0;
            if (xhr.status == 200) {
                var remoteModTime = xhr.getResponseHeader("Last-Modified");
                console.log('Cabeçalhos');
                console.log(xhr.getAllResponseHeaders());
                remoteModTime = new Date(remoteModTime).getTime();
            }

            if (remoteModTime > localStorage.lastModified) {
                console.log('Nova nota encontrada no servidor');
                status("Nova nota encontrada no servidor");
                var useit = confirm("Existe uma versão mais nova da nota no servidor. \n" + 
                    "Clique em ok para usar essa versão " +
                    "ou clique em cancelar para continuar editando esta versão e substituir a do servidor"
                );
                
                var now = Date.now();
                if (useit) {
                    editor.value = localStorage.note = xhr.responseText;
                    localStorage.lastSaved = now;
                    console.log('Versão mais recente da nota carregada');
                    status("Versão mais recente da nota carregada");
                }
                else 
                    console.log('Ignorando nova versão da nota');
                    status("Ignorando nova versão da nota");
                localStorage.lastModified = now;
            }
            else
                console.log('Estamos editando a versão atual da nota');
                status("Estamos editando a versão atual da nota");

            if (localStorage.lastModified > localStorage.lastSaved) {
                save();
            }

            editor.disabled = false;
            editor.focus();
        }
    }
    else {
        console.log('Não podemos sincronizar enquanto estivermos off-line');
        status("Não podemos sincronizar enquanto estivermos off-line");
        editor.disabled = false;
        editor.focus();
    }
}
