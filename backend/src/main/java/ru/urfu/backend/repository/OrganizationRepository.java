package ru.urfu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;

import java.util.List;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long>, JpaSpecificationExecutor<Organization> {

    boolean existsByTitle(String title);

    @Query("""
        select o
        from Organization o
        where not exists (
            select 1
            from UserOrganization uo
            where uo.organization = o
              and uo.user = :user
              and uo.isEnabled = true
        )
    """)
    List<Organization> findAllWhereUserNotEnabled(@Param("user") User user);
}
