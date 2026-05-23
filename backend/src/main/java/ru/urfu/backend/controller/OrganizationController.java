package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.CreatedResponse;
import ru.urfu.backend.dto.DeletedResponse;
import ru.urfu.backend.dto.LeftResponse;
import ru.urfu.backend.dto.invite.GenerateOrganizationInviteRequestDto;
import ru.urfu.backend.dto.invite.OrganizationInviteDto;
import ru.urfu.backend.dto.invite.OrganizationInviteJoinResponseDto;
import ru.urfu.backend.dto.invite.OrganizationInviteShortResponse;
import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.dto.organization.join.OrganizationJoinApprovedResponse;
import ru.urfu.backend.dto.organization.join.OrganizationJoinRejectedResponse;
import ru.urfu.backend.dto.organization.join.OrganizationJoinResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.OrganizationInviteMapper;
import ru.urfu.backend.mapper.OrganizationMapper;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.OrganizationInvite;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
import ru.urfu.backend.model.enums.OrganizationJoinStatus;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.OrganizationInviteService;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.service.UserService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "Управление организациями")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.ORGANIZATIONS)
public class OrganizationController {

    private final OrganizationInviteService organizationInviteService;
    private final OrganizationInviteMapper organizationInviteMapper;
    private final OrganizationService organizationService;
    private final OrganizationMapper organizationMapper;
    private final AuthService authService;
    private final UserService userService;

    @Autowired
    public OrganizationController(
            OrganizationInviteService organizationInviteService,
            OrganizationInviteMapper organizationInviteMapper,
            OrganizationService organizationService,
            OrganizationMapper organizationMapper,
            AuthService authService,
            UserService userService
    ) {
        this.organizationInviteService = organizationInviteService;
        this.organizationInviteMapper = organizationInviteMapper;
        this.organizationService = organizationService;
        this.organizationMapper = organizationMapper;
        this.authService = authService;
        this.userService = userService;
    }

    @Operation(description = "Получение организации по id")
    @GetMapping("/{organizationId}")
    public OrganizationDetailsResponse getOrganizationById(@PathVariable("organizationId") Long organizationId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Organization organization = organizationService.getById(organizationId);
        if(!organizationService.isUserExistsInOrganization(organization, user)) {
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }
        String viewerRole = "GUEST";
        if(organizationService.isUserExistsInOrganization(organization, user)) {
            UserOrganization userOrganization = organizationService.getUserOrganization(user, organization);
            viewerRole = userOrganization.getAdmin() ? "OWNER" : "MEMBER";
        }
        return organizationMapper.mapToOrganizationDetailsDto(user, organization, viewerRole);
    }

    @Operation(description = "Получение организаций пользователя")
    @GetMapping("/my")
    public List<OrganizationListItemResponse> getMyOrganizations(
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<UserOrganization> userOrganizations = organizationService.getMyOrganizations(user);
        List<OrganizationListItemResponse> result = new ArrayList<>();
        for(var userOrganization : userOrganizations) {
            result.add(organizationMapper.mapToOrganizationListItemResponse(
                    userOrganization.getOrganization(),
                    userOrganization.getAdmin()
            ));
        }
        return result;
    }

    @Operation(description = "Получение организаций пользователя с проектами")
    @GetMapping("/my-with-projects")
    public List<OrganizationProjectsCardResponse> getMyOrganizationsWithProjects()
            throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<UserOrganization> userOrganizations = organizationService.getMyOrganizations(user);
        List<OrganizationProjectsCardResponse> result = new ArrayList<>();
        for(var userOrganization : userOrganizations) {
            result.add(organizationMapper.mapToOrganizationProjectsCardDto(
                    user, userOrganization.getOrganization(), userOrganization.getAdmin()));
        }
        return result;
    }

    @Operation(description = "Поиск организаций для вступления")
    @GetMapping("/search")
    public List<OrganizationListItemDto> getOrganizationForInvite(
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Organization> organizations = organizationService.getOrganizationsToJoin(user);
        List<OrganizationListItemDto> result = new ArrayList<>();

        for(Organization organization : organizations) {
            result.add(organizationMapper.mapToOrganizationListItemDto(
                    organization,
                    organizationService.isOrganizationContainsPendingJoinRequest(organization, user)
            ));
        }

        return result;
    }

    @Operation(description = "Создание организации")
    @PostMapping
    public ResponseEntity<CreatedResponse> create(@ModelAttribute OrganizationCreateRequest request) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        if(organizationService.isOrganizationExistsByTitle(request.name())){
            throw new RuntimeException("409 ORGANIZATION_NAME_CONFLICT");
        }
        Organization organization = organizationService.create(request, user);
        return ResponseEntity.status(201).body(new CreatedResponse(organization.getId()));
    }

    @Operation(description = "Обновление организации по id")
    @PatchMapping("/{organizationId}")
    public OrganizationDetailsResponse updateOrganizationById(
            @PathVariable("organizationId") Long organizationId, @ModelAttribute OrganizationUpdateRequest request) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Organization organization = organizationService.getById(organizationId);
        if(!organizationService.isUserAdminInOrganization(user, organization)){
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }
        Organization updatedOrganization = organizationService.update(request, organization);
        String viewerRole = "GUEST";
        if(organizationService.isUserExistsInOrganization(organization, user)) {
            UserOrganization userOrganization = organizationService.getUserOrganization(user, organization);
            viewerRole = userOrganization.getAdmin() ? "OWNER" : "MEMBER";
        }
        return organizationMapper.mapToOrganizationDetailsDto(user, updatedOrganization, viewerRole);
    }

    @Operation(description = "Удаление организации по id")
    @DeleteMapping("/{organizationId}")
    public DeletedResponse deleteOrganization(@PathVariable("organizationId") Long organizationId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Organization organization = organizationService.getById(organizationId);
        if(!organizationService.isUserAdminInOrganization(user, organization)){
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }
        organizationService.delete(organization);
        return new DeletedResponse(true);
    }

    @Operation(description = "Создание запроса на добавление текущего пользователя в организацию")
    @PostMapping("/{organizationId}/join-requests")
    public ResponseEntity<OrganizationJoinResponse> joinRequest(@PathVariable("organizationId") Long organizationId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Organization organization = organizationService.getById(organizationId);
        if(organizationService.isUserExistsInOrganization(organization, user)){
            throw new RuntimeException("409 ALREADY_MEMBER");
        }
        if(organizationService.isOrganizationContainsPendingJoinRequest(organization, user)){
            throw new RuntimeException("409 ORGANIZATION_ACCESS_REQUEST_ALREADY_EXISTS");
        }

        UserOrganization userOrganization = organizationService.createOrganizationJoinRequest(organization, user);
        OrganizationJoinResponse response = new OrganizationJoinResponse(true, userOrganization.getId(), OrganizationJoinStatus.PENDING);
        return ResponseEntity.status(201).body(response);
    }

    @Operation(description = "Выход пользователя из организации")
    @PostMapping("/{organizationId}/leave")
    public LeftResponse leave(@PathVariable("organizationId") Long organizationId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Organization organization = organizationService.getById(organizationId);
        if(organizationService.isUserAdminInOrganization(user, organization)){
            throw new RuntimeException("400 ADMIN_CANNOT_LEAVE");
        }
        if(!organizationService.isUserExistsInOrganization(organization, user)){
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }
        organizationService.removeUserOrganization(organization, user);
        return new LeftResponse(true);
    }

    @Operation(description = "Принятие заявки на вступление в организацию")
    @PostMapping("/{organizationId}/join-requests/{userId}/approve")
    public OrganizationJoinApprovedResponse approveJoinRequest(
            @PathVariable("organizationId") Long organizationId, @PathVariable("userId") Long userId) throws UserNotFoundException {
        User user = userService.getById(userId);
        User currentUser = authService.getAuthenticatedUser();
        Organization organization = organizationService.getById(organizationId);

        if(!organizationService.isUserAdminInOrganization(currentUser, organization)){
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }
        if(!organizationService.isOrganizationContainsPendingJoinRequest(organization, user)){
            throw new RuntimeException("404 ORGANIZATION_JOIN_REQUEST_NOT_FOUND");
        }

        organizationService.approveJoinRequest(organization, user);
        return new OrganizationJoinApprovedResponse(true);
    }

    @Operation(description = "Отклонение заявки на вступление в организацию")
    @PostMapping("/{organizationId}/join-requests/{userId}/reject")
    public OrganizationJoinRejectedResponse rejectJoinRequest(
            @PathVariable("organizationId") Long organizationId, @PathVariable("userId") Long userId) throws UserNotFoundException {
        User user = userService.getById(userId);
        User currentUser = authService.getAuthenticatedUser();
        Organization organization = organizationService.getById(organizationId);

        if(!organizationService.isUserAdminInOrganization(currentUser, organization)){
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }
        if(!organizationService.isOrganizationContainsPendingJoinRequest(organization, user)){
            throw new RuntimeException("404 ORGANIZATION_JOIN_REQUEST_NOT_FOUND");
        }

        organizationService.removeUserOrganization(organization, user);
        return new OrganizationJoinRejectedResponse(true);
    }

    @Operation(description = "Создание invite для вступления в организацию")
    @PostMapping("/{organizationId}/invites")
    public ResponseEntity<OrganizationInviteDto> createInviteLink(
            @PathVariable("organizationId") Long organizationId,
            @RequestBody GenerateOrganizationInviteRequestDto requestDto) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Organization organization = organizationService.getById(organizationId);
        if(!organizationService.isUserAdminInOrganization(user, organization)){
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }

        OrganizationInvite organizationInvite = organizationInviteService.create(requestDto, organization);
        return ResponseEntity.status(201).body(organizationInviteMapper.mapToOrganizationInviteDto(organizationInvite));
    }

    @Operation(description = "Проверка invite для вступления в организацию")
    @GetMapping("/invites/{token}")
    public OrganizationInviteShortResponse checkInviteResponse(@PathVariable("token") String token) {
        OrganizationInvite organizationInvite = organizationInviteService.getOrganizationInviteByToken(token);
        if(organizationInvite.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new RuntimeException("400 INVALID_INVITE");
        }
        return organizationInviteMapper.mapToOrganizationInviteShortResponse(organizationInvite);
    }

    @Operation(description = "Вступление в организацию с помощью invite")
    @PostMapping("/join/{token}")
    public OrganizationInviteJoinResponseDto joinByInvite(@PathVariable("token") String token) throws UserNotFoundException {
        OrganizationInvite organizationInvite = organizationInviteService.getOrganizationInviteByToken(token);
        Organization organization = organizationInvite.getOrganization();
        User user = authService.getAuthenticatedUser();
        if(organizationService.isUserExistsInOrganization(organization, user)){
            throw new RuntimeException("409 ALREADY_MEMBER");
        }
        if(organizationInvite.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new RuntimeException("400 INVALID_INVITE");
        }
        organizationService.createOrganizationJoinRequest(organization, user);
        organizationService.approveJoinRequest(organization, user);
        organizationInviteService.deleteOrganizationInvite(token);
        return new OrganizationInviteJoinResponseDto(true, organization.getId());
    }
}
