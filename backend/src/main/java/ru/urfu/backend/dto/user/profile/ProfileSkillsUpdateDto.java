package ru.urfu.backend.dto.user.profile;

import java.util.List;

public class ProfileSkillsUpdateDto {

    private SkillsByGroup skillsByGroup;

    public ProfileSkillsUpdateDto(SkillsByGroup skillsByGroup) {
        this.skillsByGroup = skillsByGroup;
    }

    public SkillsByGroup getSkillsByGroup() {
        return skillsByGroup;
    }

    public void setSkillsByGroup(SkillsByGroup skillsByGroup) {
        this.skillsByGroup = skillsByGroup;
    }

    public static class SkillsByGroup{
        private List<String> languages;
        private List<String> frameworks;
        private List<String> tools;

        public SkillsByGroup(List<String> languages, List<String> frameworks, List<String> tools) {
            this.languages = languages;
            this.frameworks = frameworks;
            this.tools = tools;
        }

        public List<String> getLanguages() {
            return languages;
        }

        public void setLanguages(List<String> languages) {
            this.languages = languages;
        }

        public List<String> getFrameworks() {
            return frameworks;
        }

        public void setFrameworks(List<String> frameworks) {
            this.frameworks = frameworks;
        }

        public List<String> getTools() {
            return tools;
        }

        public void setTools(List<String> tools) {
            this.tools = tools;
        }
    }
}
