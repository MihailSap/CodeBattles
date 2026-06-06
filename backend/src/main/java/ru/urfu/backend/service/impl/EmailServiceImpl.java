package ru.urfu.backend.service.impl;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.annotation.PreDestroy;

import ru.urfu.backend.exception.customEx.EmailSendTimeoutException;
import ru.urfu.backend.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

    @Value("${app.public-url}")
    private String publicUrl;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.mail.send-timeout-ms}")
    private long mailSendTimeoutMs;

    private final JavaMailSender mailSender;
    private final ExecutorService mailExecutor;

    @Autowired
    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        ThreadFactory threadFactory = runnable -> {
            Thread thread = new Thread(runnable);
            thread.setName("mail-sender-" + thread.threadId());
            thread.setDaemon(true);
            return thread;
        };
        this.mailExecutor = Executors.newCachedThreadPool(threadFactory);
    }

    @PreDestroy
    public void shutdownExecutor() {
        mailExecutor.shutdownNow();
    }

    @Override
    public void sendEmail(String to, String subject, String text) {
        CompletableFuture<Void> sendTask = CompletableFuture.runAsync(() -> mailSender.send(mimeMessage -> {
            MimeMessageHelper message = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());
            message.setFrom(fromAddress, fromName);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text, false);
        }), mailExecutor);

        try {
            sendTask.get(mailSendTimeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException ex) {
            sendTask.cancel(true);
            throw new EmailSendTimeoutException(
                    "Не удалось отправить письмо за " + mailSendTimeoutMs + " мс");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new EmailSendTimeoutException("Отправка письма была прервана");
        } catch (ExecutionException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new RuntimeException("Не удалось отправить письмо", cause);
        }
    }

    @Override
    public void sendEmailConfirmEmail(String email, String token) {
        String confirmationUrl = publicUrl + "/verify-email?token=" + token;
        sendEmail(
                email,
                "CodeMasters: Подтверждение почты",
                "Для подтверждения почты перейдите по ссылке: " + confirmationUrl
        );
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        String passwordResetUrl = publicUrl + "/reset-password?token=" + token;
        sendEmail(
                email,
                "CodeMasters: Сброс пароля",
                "Для сброса пароля перейдите по ссылке: " + passwordResetUrl
        );
    }
}
