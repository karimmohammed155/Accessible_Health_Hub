import nodemailer from 'nodemailer';


export const sendEmail=async({to,subject,html,attachments=[]})=>{
    const transporter=nodemailer.createTransport({
        host:"localhost",
        service:"gmail",
        port:465,
        secure:true,
        auth:{
            user:process.env.EMAIL,
            pass:process.env.PASSWORD
        }
    });
    
    const info=await transporter.sendMail({
        from:`"Accessible health hub <${process.env.EMAIL}>`,
        to,
        subject,
        html,
        attachments,
    });

    if(info.rejected.length>0) return false;
    return true;
};