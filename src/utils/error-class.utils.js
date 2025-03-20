export class Error_handler_class{
    constructor(message,status_code,stack,name,data){
    this.message=message
    this.status_code=status_code
    this.stack=stack?stack:null
    this.name=name?name:"error"
    this.data=data?data:null
    }
}