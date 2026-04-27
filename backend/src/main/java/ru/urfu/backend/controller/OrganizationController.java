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
import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.OrganizationMapper;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.service.UserService;

import java.util.List;

@Tag(name = "Управление организациями")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.ORGANIZATIONS)
public class OrganizationController {

    private final OrganizationService organizationService;
    private final OrganizationMapper organizationMapper;
    private final UserService userService;
    private final AuthService authService;

    @Autowired
    public OrganizationController(OrganizationService organizationService, OrganizationMapper organizationMapper, UserService userService, AuthService authService) {
        this.organizationService = organizationService;
        this.organizationMapper = organizationMapper;
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping("/my")
    public List<OrganizationListItemDto> getMyOrganizations() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Organization> organizations = organizationService.getByUser(user);
        return organizationMapper.mapToOrganizationListDto(organizations);
    }

    @Operation(description = "Создание организации")
    @PostMapping
    public ResponseEntity<CreatedResponse> create(@RequestBody CreateOrganizationRequestDto request) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Organization organization = organizationService.create(request, user);
        return ResponseEntity.status(201).body(new CreatedResponse(organization.getId()));
    }

    @GetMapping("/{organizationId}")
    public OrganizationDetailsDto getOrganizationById(@PathVariable("organizationId") Long organizationId){
        Organization organization = organizationService.getById(organizationId);
        return organizationMapper.mapToOrganizationDetailsDto(organization);
    }

    @PatchMapping("/{organizationId}")
    public OrganizationDetailsDto updateOrganizationById(
            @PathVariable("organizationId") Long organizationId, @RequestBody UpdateOrganizationRequest request){
        Organization organization = organizationService.getById(organizationId);
        Organization updatedOrganization = organizationService.update(request, organization);
        return organizationMapper.mapToOrganizationDetailsDto(updatedOrganization);
    }

    @Operation(description = "Удаление организации по id")
    @DeleteMapping("/{organizationId}")
    public DeletedResponse deleteOrganization(@PathVariable("organizationId") Long organizationId){
        organizationService.delete(organizationId);
        return new DeletedResponse(true);
    }

    @PostMapping("/{organizationId}/leave")
    public LeftResponse leaveOrganization(@PathVariable("organizationId") Long organizationId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Organization organization = organizationService.getById(organizationId);
        organizationService.removeUser(organization, user);
        return new LeftResponse(true);
    }

    @Operation(description = "Добавление пользователя в организацию")
    @PatchMapping("/add/{organizationId}")
    public OrganizationDetailsDto addUser(
            @PathVariable("organizationId") Long organizationId, @RequestBody UserOrganizationRequest request) throws UserNotFoundException {
        Organization organization = organizationService.getById(organizationId);
        Organization updatedOrganization = organizationService.addUser(organization, request);
        return organizationMapper.mapToOrganizationDetailsDto(updatedOrganization);
    }

    @Operation(description = "Удаление пользователя из организации")
    @PatchMapping("/{organizationId}/remove/{userId}")
    public OrganizationDetailsDto removeUser(
            @PathVariable("organizationId") Long organizationId, @PathVariable("userId") Long userId) throws UserNotFoundException {
        Organization organization = organizationService.getById(organizationId);
        User user = userService.getById(userId);
        Organization updatedOrganization = organizationService.removeUser(organization, user);
        return organizationMapper.mapToOrganizationDetailsDto(updatedOrganization);
    }

    @GetMapping("/search")
    public List<OrganizationListItemDto> getAllOrganizations() throws UserNotFoundException {
        List<Organization> organizations = organizationService.getAll();
        return organizationMapper.mapToOrganizationListDto(organizations);
    }
}
