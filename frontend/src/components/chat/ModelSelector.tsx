import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

export default function ModelSelector() {
  return (
    <div className="flex justify-center p-5">
      <Select>
        <SelectTrigger className="border-background w-auto">
          <SelectValue placeholder="ChatGPT" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gemini">Gemini</SelectItem>
          <SelectItem value="chatgpt">ChatGPT</SelectItem>
          <SelectItem value="claude">Claude</SelectItem>
          <SelectItem value="ollama">Ollama</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
