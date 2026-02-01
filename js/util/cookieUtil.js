function setCookie(name,value,daysToLive){
    const date= new Date();
    date.setDate(date.getDate() + daysToLive);

    const data = name + "=" + value + "; "
    const expires = "expires="+date.toUTCString()+"; ";
    console.log(expires);
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