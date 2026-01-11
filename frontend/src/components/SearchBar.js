import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SearchBar = ({ onSearch, value }) => {
  const [searchTerm, setSearchTerm] = useState(value || "");

  const handleSearch = (term) => {
    setSearchTerm(term);
    onSearch(term);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar transações..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10 rounded-full"
          data-testid="search-input"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 rounded-full"
            onClick={handleClear}
            data-testid="clear-search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;