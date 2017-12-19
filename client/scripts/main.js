if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register('./service-worker.js') //setting scope of sw
    .then(function(registration) {
    console.info('Service worker is registered!');
    checkForPageUpdate(registration);
    showSnackbar();
    })
    .catch(function(error) {
    console.error('Service worker failed ', error);
    });
}

function checkForPageUpdate(registration) {
    registration.addEventListener("updatefound", function() {
    if (navigator.serviceWorker.controller) {
        var installingSW = registration.installing;
        installingSW.onstatechange = function() {
        console.info("Service Worker State :", installingSW.state);
        switch(installingSW.state) {
            case 'installed':
                showSnackbar();
            break;
            case 'redundant':
            throw new Error('The installing service worker became redundant.');
        }
        }
    }
    });
}

function showSnackbar() {
    console.log("Snackbar");
    var snackbarDiv = document.getElementById("snackbar")
    snackbarDiv.innerHTML = "App is ready for Offline use!!";
    snackbarDiv.className = "show";
    setTimeout(function(){ snackbarDiv.className = snackbarDiv.className.replace("show", ""); }, 3000);
}