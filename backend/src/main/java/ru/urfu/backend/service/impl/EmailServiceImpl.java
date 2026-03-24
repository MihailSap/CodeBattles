package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import ru.urfu.backend.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

    @Value("${app.public-url}")
    private String publicUrl;

    private final JavaMailSender mailSender;

    @Autowired
    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    @Override
    public void sendEmailConfirmEmail(String email, String token) {
        String confirmationUrl = publicUrl + "/verify-email?token=" + token;
        sendEmail(
                email,
                "CodeBattles: Подтверждение почты",
                "Для подтверждения почты перейдите по ссылке: " + confirmationUrl
        );
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        String passwordResetUrl = publicUrl + "/reset-password?token=" + token;
        sendEmail(
                email,
                "CodeBattles: Сброс пароля",
                "Для сброса пароля перейдите по ссылке: " + passwordResetUrl
        );
    }
}
