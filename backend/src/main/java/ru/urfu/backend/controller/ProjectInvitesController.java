package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.JoinProjectResponse;
import ru.urfu.backend.dto.invite.InviteResponse;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.PROJECT_INVITES)
public class ProjectInvitesController {

//    @GetMapping("/{token}")
//    public InviteResponse checkInviteByToken(@PathVariable("token") String token){
//
//    }
//
//    @PostMapping("/{token}/join")
//    public JoinProjectResponse joinProjectByToken(@PathVariable("token") String token){
//
//    }
}
