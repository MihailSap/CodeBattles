package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.organization.OrganizationCreateRequest;
import ru.urfu.backend.dto.organization.OrganizationResponse;
import ru.urfu.backend.dto.organization.OrganizationUpdateDataRequest;
import ru.urfu.backend.dto.organization.UserOrganizationRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.OrganizationMapper;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.service.UserService;
import ru.urfu.backend.service.impl.UserServiceImpl;

import java.util.List;

@Tag(name = "Управление организациями")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.ORGANIZATIONS)
public class OrganizationController {

    private final OrganizationService organizationService;
    private final OrganizationMapper organizationMapper;
    private final UserService userService;

    @Autowired
    public OrganizationController(OrganizationService organizationService, OrganizationMapper organizationMapper, UserServiceImpl userServiceImpl, UserService userService) {
        this.organizationService = organizationService;
        this.organizationMapper = organizationMapper;
        this.userService = userService;
    }

    @Operation(description = "Создание организации")
    @PostMapping
    public OrganizationResponse create(@RequestBody OrganizationCreateRequest request) throws UserNotFoundException {
        Organization organization = organizationService.create(request);
        return organizationMapper.mapToOrganizationResponse(organization);
    }

    @Operation(description = "Получение всех организаций")
    @GetMapping
    public List<OrganizationResponse> getOrganizations() {
        List<Organization> organizations = organizationService.getAll();
        return organizationMapper.mapToOrganizationResponses(organizations);
    }

    @Operation(description = "Получение организации по id")
    @GetMapping("/by-id/{organizationId}")
    public OrganizationResponse getOrganizationById(@PathVariable("organizationId") Long organizationId) {
        Organization organization = organizationService.getById(organizationId);
        return organizationMapper.mapToOrganizationResponse(organization);
    }

    @Operation(description = "Получение организации по title")
    @GetMapping("/by-title/{title}")
    public OrganizationResponse getOrganizationByTitle(@PathVariable("title") String title) {
        Organization organization = organizationService.getByTitle(title);
        return organizationMapper.mapToOrganizationResponse(organization);
    }

    @Operation(description = "Обновление данных организации по id")
    @PatchMapping("/{organizationId}")
    public OrganizationResponse updateData(@PathVariable("organizationId") Long organizationId,
                                           @RequestBody OrganizationUpdateDataRequest request){
        Organization organization = organizationService.getById(organizationId);
        Organization updatedOrganization = organizationService.updateData(organization, request);
        return organizationMapper.mapToOrganizationResponse(updatedOrganization);
    }

    @Operation(description = "Добавление пользователя в организацию")
    @PatchMapping("/add/{organizationId}")
    public OrganizationResponse addUser(
            @PathVariable("organizationId") Long organizationId, @RequestBody UserOrganizationRequest request) throws UserNotFoundException {
        Organization organization = organizationService.getById(organizationId);
        Organization updatedOrganization = organizationService.addUser(organization, request);
        return organizationMapper.mapToOrganizationResponse(updatedOrganization);
    }

    @Operation(description = "Удаление пользователя из организации")
    @PatchMapping("/{organizationId}/remove/{userId}")
    public OrganizationResponse removeUser(
            @PathVariable("organizationId") Long organizationId, @PathVariable("userId") Long userId) throws UserNotFoundException {
        Organization organization = organizationService.getById(organizationId);
        User user = userService.getById(userId);
        Organization updatedOrganization = organizationService.removeUser(organization, user);
        return organizationMapper.mapToOrganizationResponse(updatedOrganization);
    }

    @Operation(description = "Удаление организации по id")
    @DeleteMapping("/{organizationId}")
    public void deleteOrganization(@PathVariable("organizationId") Long organizationId){
        Organization organization = organizationService.getById(organizationId);
        organizationService.delete(organizationId);
    }
}
