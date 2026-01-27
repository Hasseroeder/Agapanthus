function setCookie(name,value,daysToLive){
    const date= new Date();
    date.setDate(date.getDate() + daysToLive*24*60*60*1000);

    const data = name + "=" + value + "; "
    const expires = "expires="+date.toUTCString()+"; ";
    const path = "path=/; "
    document.cookie=data + expires + path;
}

function deleteCookie(name){
    setCookie(name, null, null);
}

function getCookie(name){
    const cookieDecoded = decodeURIComponent(document.cookie);
    const cookieArray = cookieDecoded.split("; ");
    
    let result = null;
    cookieArray.forEach(element => {
        if(element.indexOf(name)==0){
            result = element.substring(name.length+1);
        }
    });
    return result;
}

export {getCookie, setCookie, deleteCookie};