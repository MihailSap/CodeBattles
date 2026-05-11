package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.auth.CurrentUserResponse;
import ru.urfu.backend.dto.user.UserResponse;
import ru.urfu.backend.dto.user.UserRoleResponse;
import ru.urfu.backend.dto.user.profile.ProfileSkillsUpdateDto;
import ru.urfu.backend.model.Stack;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserStack;
import ru.urfu.backend.model.enums.StackType;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class UserMapper {

    public UserRoleResponse mapToUserRoleResponse(User user) {
        return new UserRoleResponse(user.getId(), user.getRole());
    }

    public CurrentUserResponse mapToCurrentUserResponse(User user){
        return new CurrentUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getLogin(),
                user.getRegisteredAt() == null ? null : user.getRegisteredAt().toString(),
                user.getAvatarFileTitle(),
                user.getRole(),
                user.isEnabled()
        );
    }

    public ProfileSkillsUpdateDto mapToProfileSkillsUpdateDto(User user){
        List<String> languages = new ArrayList<>();
        List<String> tools = new ArrayList<>();
        List<String> frameworks = new ArrayList<>();

        for(UserStack userStack : user.getStacks()){
            Stack stack = userStack.getStack();
            if(StackType.LANGUAGES.equals(stack.getType())){
                languages.add(stack.getTitle());
            } else if(StackType.TOOLS.equals(stack.getType())){
                tools.add(stack.getTitle());
            } else if(StackType.FRAMEWORKS.equals(stack.getType())){
                frameworks.add(stack.getTitle());
            }
        }

        return new ProfileSkillsUpdateDto(
                new ProfileSkillsUpdateDto.SkillsByGroup(
                        languages, frameworks, tools));
    }

    public UserResponse mapToUserResponse(User user) {
        List<String> clouds = new ArrayList<>();
        List<String> databases = new ArrayList<>();
        List<String> frameworks = new ArrayList<>();
        List<String> languages = new ArrayList<>();
        List<String> tools = new ArrayList<>();
        Set<UserStack> stacks = user.getStacks();
        for (UserStack stack : stacks) {
            Stack s = stack.getStack();
            if(StackType.CLOUDS.equals(s.getType())) {
                clouds.add(s.getTitle());
            }
            if(StackType.DATABASES.equals(s.getType())) {
                databases.add(s.getTitle());
            }
            if(StackType.FRAMEWORKS.equals(s.getType())) {
                databases.add(s.getTitle());
            }
            if(StackType.LANGUAGES.equals(s.getType())) {
                databases.add(s.getTitle());
            }
            if(StackType.TOOLS.equals(s.getType())) {
                databases.add(s.getTitle());
            }
        }

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getLogin(),
                user.getRole(),
                user.isEnabled(),
                clouds,
                databases,
                frameworks,
                languages,
                tools
        );
    }
}
