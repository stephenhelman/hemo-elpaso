"use client";

import { useRef, useEffect, useCallback } from "react";
import Script from "next/script";

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function PlacesAutocompleteInput({
  value,
  onChange,
  required,
  placeholder,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || autocompleteRef.current) return;
    if (!window.google?.maps?.places?.Autocomplete) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment", "geocode"],
      fields: ["formatted_address", "name"],
    });

    listenerRef.current = ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      // Prefer formatted_address; fall back to whatever is in the input
      const address = place.formatted_address ?? inputRef.current?.value ?? "";
      onChange(address);
    });

    autocompleteRef.current = ac;
  }, [onChange]);

  // Init if script was already loaded before this component mounted
  useEffect(() => {
    if (window.google?.maps?.places?.Autocomplete) {
      initAutocomplete();
    }
    return () => {
      if (listenerRef.current) {
        window.google?.maps?.event?.removeListener(listenerRef.current);
      }
    };
  }, [initAutocomplete]);

  // Keep the raw DOM input value in sync with parent (e.g. on edit-form load)
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = value;
    }
  }, [value]);

  // No API key — plain controlled input
  if (!API_KEY) {
    return (
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <>
      <Script
        id="google-maps-places"
        src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={initAutocomplete}
      />
      {/*
        Uncontrolled input — autocomplete owns the DOM value.
        We still wire onChange so manual typing without picking a suggestion works.
      */}
      <input
        ref={inputRef}
        type="text"
        required={required}
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    </>
  );
}
