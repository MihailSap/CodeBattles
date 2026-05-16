package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ru.urfu.backend.model.Stack;
import ru.urfu.backend.model.enums.StackType;
import ru.urfu.backend.repository.StackRepository;
import ru.urfu.backend.service.StackService;

import java.util.Optional;

@Service
public class StackServiceImpl implements StackService {

    private final StackRepository stackRepository;

    @Autowired
    public StackServiceImpl(StackRepository stackRepository) {
        this.stackRepository = stackRepository;
    }

    @Override
    public Stack getOrCreate(String title) {
        Optional<Stack> stack = stackRepository.findByTitle(title);
        if(stack.isPresent()) {
            return stack.get();
        }

        Stack newStack = new Stack();
        newStack.setTitle(title);
        newStack.setType(StackType.OTHER);
        return stackRepository.save(newStack);
    }

    @Override
    public Stack getOrUpdate(String title, StackType type) {
        Optional<Stack> optionalStack = stackRepository.findByTitle(title);
        if(optionalStack.isPresent()) {
            Stack stack = optionalStack.get();
            if(StackType.OTHER.equals(stack.getType())) {
                stack.setType(type);
            }
            return stackRepository.save(stack);
        }

        Stack newStack = new Stack();
        newStack.setTitle(title);
        newStack.setType(type);
        return stackRepository.save(newStack);
    }
}
