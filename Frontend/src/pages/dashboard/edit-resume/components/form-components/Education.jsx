import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle } from "lucide-react";
import { useDispatch } from "react-redux";
import { addResumeData } from "@/features/resume/resumeFeatures";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { updateThisResume } from "@/Services/resumeAPI";

const formFields = {
  universityName: "",
  degree: "",
  major: "",
  grade: "",
  gradeType: "CGPA",
  startDate: "",
  endDate: "",
  description: "",
};

function UniversityInput({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchUniversities = (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoadingSearch(true);
    fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(searchQuery)}&limit=6`)
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data.slice(0, 6));
        setShowDropdown(data.length > 0);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSearch(false));
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // update parent immediately as user types
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUniversities(val), 400);
  };

  const handleSelect = (university) => {
    const name = university.name;
    setQuery(name);
    onChange(name);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search university..."
          autoComplete="off"
        />
        {loadingSearch && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoaderCircle className="animate-spin h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-52 overflow-y-auto">
          {suggestions.map((uni, i) => (
            <div
              key={i}
              onClick={() => handleSelect(uni)}
              className="px-4 py-2 hover:bg-primary hover:text-white cursor-pointer text-sm border-b last:border-0 transition-colors"
            >
              <p className="font-medium">{uni.name}</p>
              <p className="text-xs opacity-60">{uni.country}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Education({ resumeInfo, enanbledNext }) {
  const [educationalList, setEducationalList] = useState(
    resumeInfo?.education || [{ ...formFields }]
  );
  const { resume_id } = useParams();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(addResumeData({ ...resumeInfo, education: educationalList }));
  }, [educationalList]);

  const AddNewEducation = () => {
    setEducationalList([...educationalList, { ...formFields }]);
  };

  const RemoveEducation = () => {
    setEducationalList((list) => list.slice(0, -1));
  };

  const onSave = () => {
    if (educationalList.length === 0) {
      return toast("Please add at least one education", "error");
    }
    setLoading(true);
    const data = { data: { education: educationalList } };
    if (resume_id) {
      updateThisResume(resume_id, data)
        .then(() => toast("Resume Updated", "success"))
        .catch((error) => toast("Error updating resume", `${error.message}`))
        .finally(() => setLoading(false));
    }
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const list = [...educationalList];
    list[index] = { ...list[index], [name]: value };
    setEducationalList(list);
  };

  const handleUniversityChange = (value, index) => {
    const list = [...educationalList];
    list[index] = { ...list[index], universityName: value };
    setEducationalList(list);
  };

  return (
    <div className="p-5 shadow-lg rounded-lg border-t-primary border-t-4 mt-10">
      <h2 className="font-bold text-lg">Education</h2>
      <p>Add Your educational details</p>

      <div>
        {educationalList.map((item, index) => (
          <div key={index}>
            <div className="grid grid-cols-2 gap-3 border p-3 my-5 rounded-lg">
              <div className="col-span-2">
                <label>University Name</label>
                <UniversityInput
                  value={item?.universityName}
                  onChange={(val) => handleUniversityChange(val, index)}
                />
              </div>
              <div>
                <label>Degree</label>
                <Input name="degree" onChange={(e) => handleChange(e, index)} defaultValue={item?.degree} />
              </div>
              <div>
                <label>Major</label>
                <Input name="major" onChange={(e) => handleChange(e, index)} defaultValue={item?.major} />
              </div>
              <div>
                <label>Start Date</label>
                <Input type="date" name="startDate" onChange={(e) => handleChange(e, index)} defaultValue={item?.startDate} />
              </div>
              <div>
                <label>End Date</label>
                <Input type="date" name="endDate" onChange={(e) => handleChange(e, index)} defaultValue={item?.endDate} />
              </div>
              <div className="col-span-2">
                <label>Grade</label>
                <div className="flex justify-center items-center gap-4">
                  <select
                    name="gradeType"
                    className="py-2 px-4 rounded-md border"
                    onChange={(e) => handleChange(e, index)}
                    value={item?.gradeType}
                  >
                    <option value="CGPA">CGPA</option>
                    <option value="GPA">GPA</option>
                    <option value="Percentage">Percentage</option>
                  </select>
                  <Input type="text" name="grade" onChange={(e) => handleChange(e, index)} defaultValue={item?.grade} />
                </div>
              </div>
              <div className="col-span-2">
                <label>Description</label>
                <Textarea name="description" onChange={(e) => handleChange(e, index)} defaultValue={item?.description} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={AddNewEducation} className="text-primary">
            + Add More Education
          </Button>
          <Button variant="outline" onClick={RemoveEducation} className="text-primary">
            - Remove
          </Button>
        </div>
        <Button disabled={loading} onClick={onSave}>
          {loading ? <LoaderCircle className="animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default Education;