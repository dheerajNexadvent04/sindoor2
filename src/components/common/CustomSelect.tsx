"use client";

import React, { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';
import { ChevronDown } from 'lucide-react';

interface Option {
    label: string;
    value: string;
}

interface CustomSelectProps {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    options: Option[];
    placeholder?: string;
    required?: boolean;
    className?: string; // For any extra wrapper custom classes if needed
}

const CustomSelect: React.FC<CustomSelectProps> = ({ name, value, onChange, options, placeholder = "Select", required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Setup value for display
    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (optionValue: string) => {
        // Create an event-like object to trigger the original onChange
        const event = {
            target: {
                name: name,
                value: optionValue
            }
        };
        onChange(event);
        setIsOpen(false);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={`${styles.customSelect} ${isOpen ? styles.open : ''}`} ref={selectRef}>
            <div className={styles.customSelectTrigger} onClick={() => setIsOpen(!isOpen)}>
                <span className={value ? '' : styles.placeholder}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={18} className={styles.icon} />
            </div>
            <div className={styles.optionsList}>
                {options.map((option) => (
                    <div
                        key={option.value}
                        className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                        onClick={() => handleSelect(option.value)}
                    >
                        {option.label}
                    </div>
                ))}
            </div>
            {/* Hidden native input for required validation if needed, though custom handling is usually better */}
            <input
                type="text"
                name={name}
                value={value}
                onChange={() => { }}
                required={required}
                style={{ position: 'absolute', opacity: 0, height: 0, width: 0, bottom: 0 }}
            />
        </div>
    );
};

export default CustomSelect;
